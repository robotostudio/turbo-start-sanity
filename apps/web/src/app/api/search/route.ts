import {
  searchBlogsGraceful,
  searchParamsSchema,
  type SearchResult,
} from "@workspace/opensearch";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

import { sanityFetch } from "@/lib/sanity/live";
import { queryAllBlogDataForSearch } from "@/lib/sanity/query";
import type { QueryAllBlogDataForSearchResult } from "@/lib/sanity/sanity.types";

/**
 * GET /api/search?q=...&author=...&dateFrom=...&dateTo=...&page=1&limit=10
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  // Validate parameters
  const parseResult = searchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    const errors = z.prettifyError(parseResult.error);
    return NextResponse.json(
      { error: "Invalid search parameters", details: errors },
      { status: 400 },
    );
  }

  const params = parseResult.data;

  // Try OpenSearch first (includes health check + graceful degradation)
  try {
    const results = await searchBlogsGraceful(params);

    if (results) {
      return NextResponse.json({
        ...results,
        source: "opensearch",
      });
    }
  } catch (error) {
    console.error("[search] OpenSearch query failed, falling back:", error);
  }

  return fallbackSearch(params);
}

/**
 * Fallback search when OpenSearch is unavailable.
 */
async function fallbackSearch(
  params: z.infer<typeof searchParamsSchema>,
): Promise<NextResponse> {
  try {
    const { data } = await sanityFetch({
      query: queryAllBlogDataForSearch,
      stega: false,
    });

    if (!data) {
      return NextResponse.json(
        { error: "No data found" },
        { status: 404 },
      );
    }

    const blogs = data as QueryAllBlogDataForSearchResult;

    const query = params.q.toLowerCase();

    let filtered = blogs.filter((blog) => {
      const title = (blog.title ?? "").toLowerCase();
      const description = (blog.description ?? "").toLowerCase();
      const authorName = (blog.authors?.name ?? "").toLowerCase();
      const slug = (blog.slug ?? "").toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        authorName.includes(query) ||
        slug.includes(query)
      );
    });

    if (params.author) {
      filtered = filtered.filter(
        (blog) => blog.authors?.name === params.author,
      );
    }

    if (params.category) {
      filtered = filtered.filter((blog) => {
        const categories = (
          blog as { categories?: string[] | null }
        ).categories ?? [];
        return categories.includes(params.category!);
      });
    }

    if (params.dateFrom) {
      filtered = filtered.filter(
        (blog) =>
          blog.publishedAt && blog.publishedAt >= params.dateFrom!,
      );
    }

    if (params.dateTo) {
      filtered = filtered.filter(
        (blog) =>
          blog.publishedAt && blog.publishedAt <= params.dateTo!,
      );
    }

    const start = (params.page - 1) * params.limit;
    const paginatedResults = filtered.slice(start, start + params.limit);

    const hits = paginatedResults.map((blog) => ({
      _id: blog._id,
      _type: blog._type as "blog",
      title: blog.title,
      description: blog.description,
      slug: blog.slug,
      authorName: blog.authors?.name ?? null,
      authorId: blog.authors?._id ?? null,
      categories: ((blog as { categories?: string[] | null }).categories ?? []),
      publishedAt: blog.publishedAt,
      image: blog.image,
      authors: blog.authors,
      orderRank: blog.orderRank,
      seoHideFromLists: false,
    }));

    const categoryCounts = new Map<string, number>();
    for (const blog of blogs) {
      const categories = (
        blog as { categories?: string[] | null }
      ).categories ?? [];
      for (const category of categories) {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
    }

    const authorCounts = new Map<string, number>();
    for (const blog of blogs) {
      const name = blog.authors?.name;
      if (name) {
        authorCounts.set(name, (authorCounts.get(name) ?? 0) + 1);
      }
    }

    const result: SearchResult & { source: string } = {
      hits,
      total: filtered.length,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(filtered.length / params.limit),
      facets: {
        categories: Array.from(categoryCounts.entries()).map(([key, count]) => ({
          key,
          count,
        })),
        authors: Array.from(authorCounts.entries()).map(([key, count]) => ({
          key,
          count,
        })),
        dateRanges: [],
      },
      source: "fallback",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[search] Fallback search also failed:", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 503 },
    );
  }
}
