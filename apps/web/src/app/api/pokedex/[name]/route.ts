import { NextResponse } from "next/server";

import { getPokemonDetail } from "@/lib/pokeapi";

/**
 * GET /api/pokedex/[name]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  try {
    const pokemon = await getPokemonDetail(name);
    return NextResponse.json(pokemon);
  } catch (error) {
    console.error(`[pokedex/${name}] Failed:`, error);
    return NextResponse.json(
      { error: `Pokemon '${name}' not found` },
      { status: 404 },
    );
  }
}
