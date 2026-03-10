import { NextResponse } from "next/server";

import { fallbackFuseSearch, fetchAllBlogsForSearch } from "@/lib/search/sanity";
import { searchBlogs } from "@/lib/search/opensearch";
import { searchPokemon } from "@/lib/pokemon/opensearch";
import type { SearchablePokemon } from "@/lib/pokemon/types";

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

  // Fan out to blogs and Pokémon in parallel
  const [blogsResult, pokemonResults] = await Promise.allSettled([
    searchBlogs(query, {
      limit: Number.isFinite(limit) ? limit : 10,
      author,
      dateFrom,
      dateTo,
    }),
    searchPokemon(query, 5),
  ]);

  // Blogs — fall back to Fuse.js if OpenSearch is unavailable
  let blogResults: Awaited<ReturnType<typeof searchBlogs>> | null = null;
  if (blogsResult.status === "fulfilled") {
    blogResults = blogsResult.value;
  } else {
    try {
      const allBlogs = await fetchAllBlogsForSearch();
      const fallback = fallbackFuseSearch(
        allBlogs,
        query,
        Number.isFinite(limit) ? limit : 10
      );
      blogResults = { results: fallback, total: fallback.length, source: "fallback" };
    } catch {
      blogResults = { results: [], total: 0, source: "fallback" };
    }
  }

  const pokemon: SearchablePokemon[] =
    pokemonResults.status === "fulfilled" ? pokemonResults.value : [];

  return NextResponse.json({
    results: blogResults.results,
    total: blogResults.total,
    source: blogResults.source,
    pokemon,
  });
}
