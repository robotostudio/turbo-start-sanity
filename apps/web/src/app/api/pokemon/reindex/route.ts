import { NextResponse } from "next/server";

import { fetchPokemonList, fetchPokemonSummary } from "@/lib/pokemon/fetcher";
import { bulkReplacePokemon } from "@/lib/pokemon/opensearch";
import type { SearchablePokemon } from "@/lib/pokemon/types";

const BATCH_SIZE = 50; // stay well within PokeAPI fair-use rate limits

function isAuthorized(req: Request) {
  const secret = process.env.SEARCH_REINDEX_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") && auth.slice(7) === secret;
}

async function fetchInBatches(names: string[]): Promise<SearchablePokemon[]> {
  const results: SearchablePokemon[] = [];
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    const summaries = await Promise.all(
      batch.map((n) => fetchPokemonSummary(n).catch(() => null))
    );
    for (const s of summaries) {
      if (!s) continue;
      results.push({
        id: s.id,
        name: s.name,
        types: s.types,
        typesText: s.types.join(" "),
        officialArt: s.sprites.official,
      });
    }
  }
  return results;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Gens 1–9: 1010 Pokémon (excludes forms)
    const list = await fetchPokemonList(1010, 0);
    const names = list.results.map((r) => r.name);

    const pokemon = await fetchInBatches(names);
    await bulkReplacePokemon(pokemon);

    return NextResponse.json({ ok: true, indexedCount: pokemon.length });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Reindex failed",
      },
      { status: 500 }
    );
  }
}
