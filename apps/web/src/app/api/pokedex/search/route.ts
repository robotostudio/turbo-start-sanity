import { NextResponse } from "next/server";

import { searchPokemonByName } from "@/lib/pokeapi";

/**
 * GET /api/pokedex/search?q=char&limit=5
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 20);

  if (!q || q.length < 1) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  try {
    const results = await searchPokemonByName(q, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[pokedex/search] Failed:", error);
    return NextResponse.json(
      { error: "Failed to search Pokemon" },
      { status: 500 },
    );
  }
}
