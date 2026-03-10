import { NextResponse } from "next/server";

import { searchPokemon } from "@/lib/pokemon/opensearch";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  try {
    const results = await searchPokemon(query, limit);
    return NextResponse.json({ results, total: results.length, source: "opensearch" });
  } catch {
    return NextResponse.json(
      { error: "Search unavailable" },
      { status: 503 }
    );
  }
}
