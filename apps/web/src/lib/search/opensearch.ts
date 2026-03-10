import { Client } from "@opensearch-project/opensearch";

import type {
  BlogSearchFilters,
  SearchResponse,
  SearchableBlog,
} from "@/lib/search/types";

const INDEX_NAME = "blogs";

function getOpenSearchUrl() {
  return process.env.OPENSEARCH_URL ?? "http://localhost:9200";
}

export function getOpenSearchClient() {
  return new Client({ node: getOpenSearchUrl() });
}

function buildShouldClauses(query: string) {
  return [
    {
      multi_match: {
        query,
        fields: [
          "title^4",
          "title.stemmed^3",
          "description^2",
          "description.stemmed",
          "authorName^2",
          "slug",
        ],
        fuzziness: "AUTO",
        type: "best_fields",
      },
    },
    {
      match_phrase_prefix: {
        title: {
          query,
          boost: 2,
        },
      },
    },
  ] as const;
}

export async function ensureBlogIndex() {
  const client = getOpenSearchClient();
  const indexExists = await client.indices.exists({ index: INDEX_NAME });

  if (indexExists.body) {
    return;
  }

  await client.indices.create({
    index: INDEX_NAME,
    body: {
      settings: {
        analysis: {
          filter: {
            blog_synonym_filter: {
              type: "synonym",
              synonyms: [
                "ai,artificial intelligence",
                "js,javascript",
                "ts,typescript",
                "ux,user experience",
              ],
            },
          },
          analyzer: {
            blog_text_analyzer: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "blog_synonym_filter", "porter_stem"],
            },
          },
        },
      },
      mappings: {
        properties: {
          sanityId: { type: "keyword" },
          title: {
            type: "text",
            analyzer: "blog_text_analyzer",
            fields: {
              keyword: { type: "keyword" },
              stemmed: {
                type: "text",
                analyzer: "english",
              },
            },
          },
          description: {
            type: "text",
            analyzer: "blog_text_analyzer",
            fields: {
              stemmed: {
                type: "text",
                analyzer: "english",
              },
            },
          },
          slug: { type: "keyword" },
          publishedAt: { type: "date" },
          authorId: { type: "keyword" },
          authorName: {
            type: "text",
            fields: {
              keyword: { type: "keyword" },
            },
          },
          raw: {
            type: "object",
            enabled: false,
          },
        },
      },
    },
  });
}

function toIndexDocument(blog: SearchableBlog) {
  return {
    sanityId: blog._id,
    title: blog.title ?? "",
    description: blog.description ?? "",
    slug: blog.slug ?? "",
    publishedAt: blog.publishedAt ?? null,
    authorId: blog.authors?._id ?? "",
    authorName: blog.authors?.name ?? "",
    raw: blog,
  };
}

export async function upsertBlogDocument(blog: SearchableBlog) {
  const client = getOpenSearchClient();
  await ensureBlogIndex();

  await client.index({
    index: INDEX_NAME,
    id: blog._id,
    body: toIndexDocument(blog),
    refresh: true,
  });
}

export async function deleteBlogDocument(blogId: string) {
  const client = getOpenSearchClient();
  await ensureBlogIndex();

  await client.delete({
    index: INDEX_NAME,
    id: blogId,
    refresh: true,
  });
}

export async function bulkReplaceBlogs(blogs: SearchableBlog[]) {
  const client = getOpenSearchClient();
  await ensureBlogIndex();

  const existing = await client.search({
    index: INDEX_NAME,
    body: {
      query: { match_all: {} },
      _source: ["sanityId"],
      size: 10_000,
    },
  });

  const existingIds = new Set<string>(
    (existing.body.hits.hits as Array<{ _id: string }>).map((hit) => hit._id)
  );

  const nextIds = new Set(blogs.map((blog) => blog._id));

  const operations: Array<Record<string, unknown>> = [];

  for (const blog of blogs) {
    operations.push({ index: { _index: INDEX_NAME, _id: blog._id } });
    operations.push(toIndexDocument(blog));
  }

  for (const id of existingIds) {
    if (!nextIds.has(id)) {
      operations.push({ delete: { _index: INDEX_NAME, _id: id } });
    }
  }

  if (operations.length > 0) {
    await client.bulk({
      refresh: true,
      body: operations,
    });
  }
}

export async function searchBlogs(
  query: string,
  filters: BlogSearchFilters
): Promise<SearchResponse> {
  const client = getOpenSearchClient();
  await ensureBlogIndex();

  const limit = Math.max(1, Math.min(filters.limit ?? 10, 50));

  const filterClauses: Array<Record<string, unknown>> = [];

  if (filters.author) {
    filterClauses.push({
      term: { "authorName.keyword": filters.author },
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    const range: { gte?: string; lte?: string } = {};
    if (filters.dateFrom) {
      range.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      range.lte = filters.dateTo;
    }

    filterClauses.push({
      range: {
        publishedAt: range,
      },
    });
  }

  const response = await client.search({
    index: INDEX_NAME,
    body: {
      size: limit,
      query: {
        bool: {
          should: buildShouldClauses(query),
          minimum_should_match: 1,
          filter: filterClauses,
        },
      },
      sort: [{ _score: { order: "desc" } }, { publishedAt: { order: "desc" } }],
    },
  });

  const hits = response.body.hits.hits as Array<{
    _source?: {
      raw?: SearchableBlog;
    };
  }>;

  const results = hits
    .map((hit) => hit._source?.raw)
    .filter((item): item is SearchableBlog => Boolean(item));

  return {
    results,
    total:
      typeof response.body.hits.total === "number"
        ? response.body.hits.total
        : response.body.hits.total.value,
    source: "opensearch",
  };
}
