import { NextResponse } from "next/server";

import { fallbackFuseSearch, fetchAllBlogsForSearch } from "@/lib/search/sanity";
import { searchBlogs } from "@/lib/search/opensearch";

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const limit = Number(searchParams.get("limit") ?? "10");
  const author = searchParams.get("author") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  try {
    const response = await searchBlogs(query, {
      limit: Number.isFinite(limit) ? limit : 10,
      author,
      dateFrom,
      dateTo,
    });

    return NextResponse.json(response);
  } catch {
    const blogs = await fetchAllBlogsForSearch();
    const fallback = fallbackFuseSearch(
      blogs,
      query,
      Number.isFinite(limit) ? limit : 10
    );

    return NextResponse.json({
      results: fallback,
      total: fallback.length,
      source: "fallback",
    });
  }
}
