import { z } from "zod/v4";
import { getOpenSearchClient, isOpenSearchHealthy } from "./client";
import { BLOG_INDEX, type BlogDocument } from "./mapping";

export const searchParamsSchema = z.object({
  q: z.string().min(1).max(200),
  author: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export type SearchResult = {
  hits: BlogDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: {
    categories: Array<{ key: string; count: number }>;
    authors: Array<{ key: string; count: number }>;
    dateRanges: Array<{ key: string; from?: string; to?: string; count: number }>;
  };
};

export async function searchBlogs(
  params: SearchParams,
): Promise<SearchResult> {
  const client = getOpenSearchClient();
  const { q, author, category, dateFrom, dateTo, page, limit } = params;
  const filters: Record<string, unknown>[] = [
    {
      bool: {
        should: [
          { term: { seoHideFromLists: false } },
          {
            bool: {
              must_not: { exists: { field: "seoHideFromLists" } },
            },
          },
        ],
      },
    },
  ];

  if (author) {
    filters.push({ term: { "authorName.keyword": author } });
  }

  if (category) {
    filters.push({ term: { categories: category } });
  }

  if (dateFrom || dateTo) {
    const range: Record<string, string> = {};
    if (dateFrom) range.gte = dateFrom;
    if (dateTo) range.lte = dateTo;
    filters.push({ range: { publishedAt: range } });
  }

  const searchBody = {
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        must: [
          {
            bool: {
              should: [
                {
                  multi_match: {
                    query: q,
                    fields: [
                      "title^3",
                      "description^2",
                      "authorName",
                    ],
                    type: "best_fields",
                    fuzziness: "AUTO",
                    prefix_length: 1,
                  },
                },
                {
                  multi_match: {
                    query: q,
                    fields: [
                      "title.autocomplete^2",
                      "description.autocomplete",
                    ],
                    type: "best_fields",
                  },
                },
                {
                  multi_match: {
                    query: q,
                    fields: ["title^5", "description^3"],
                    type: "phrase",
                    slop: 2,
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        filter: filters,
      },
    },
    aggs: {
      categories: {
        terms: {
          field: "categories",
          size: 20,
        },
      },
      authors: {
        terms: {
          field: "authorName.keyword",
          size: 20,
        },
      },
      date_ranges: {
        date_range: {
          field: "publishedAt",
          ranges: [
            { key: "Last 7 days", from: "now-7d/d" },
            { key: "Last 30 days", from: "now-30d/d" },
            { key: "Last 90 days", from: "now-90d/d" },
            { key: "Last year", from: "now-1y/d" },
            { key: "Older", to: "now-1y/d" },
          ],
        },
      },
    },
    highlight: {
      fields: {
        title: { number_of_fragments: 0 },
        description: { number_of_fragments: 1, fragment_size: 200 },
      },
      pre_tags: ["<mark>"],
      post_tags: ["</mark>"],
    },
    sort: ["_score", { publishedAt: { order: "desc", missing: "_last" } }],
  };

  const { body } = await client.search({
    index: BLOG_INDEX,
    body: searchBody,
  });

  const total =
    typeof body.hits.total === "number"
      ? body.hits.total
      : body.hits.total?.value ?? 0;

  const hits: BlogDocument[] = body.hits.hits.map(
    (hit: { _source: BlogDocument; highlight?: Record<string, string[]> }) => ({
      ...hit._source,
      ...(hit.highlight && { _highlight: hit.highlight }),
    }),
  );

  const categoryBuckets = body.aggregations?.categories?.buckets ?? [];
  const authorBuckets = body.aggregations?.authors?.buckets ?? [];
  const dateRangeBuckets = body.aggregations?.date_ranges?.buckets ?? [];

  return {
    hits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    facets: {
      categories: categoryBuckets.map(
        (b: { key: string; doc_count: number }) => ({
          key: b.key,
          count: b.doc_count,
        }),
      ),
      authors: authorBuckets.map(
        (b: { key: string; doc_count: number }) => ({
          key: b.key,
          count: b.doc_count,
        }),
      ),
      dateRanges: dateRangeBuckets.map(
        (b: { key: string; from_as_string?: string; to_as_string?: string; doc_count: number }) => ({
          key: b.key,
          from: b.from_as_string,
          to: b.to_as_string,
          count: b.doc_count,
        }),
      ),
    },
  };
}

export async function searchBlogsGraceful(
  params: SearchParams,
): Promise<SearchResult | null> {
  try {
    const healthy = await isOpenSearchHealthy();
    if (!healthy) {
      console.warn("[opensearch] Cluster is not healthy, skipping search");
      return null;
    }
    return await searchBlogs(params);
  } catch (error) {
    console.error("[opensearch] Search failed:", error);
    return null;
  }
}
