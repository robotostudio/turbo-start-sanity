import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PokemonGrid } from "@/components/pokedex/pokemon-grid";
import { PokemonGridSkeleton } from "@/components/pokedex/pokemon-grid-skeleton";
import { TypeFilter } from "@/components/pokedex/type-filter";
import { getPokemonByType, getPokemonList } from "@/lib/pokeapi";
import { POKEMON_TYPES } from "@/lib/pokeapi/types";

export const metadata: Metadata = {
  title: "Pokédex — Browse All Pokémon",
  description:
    "Browse the complete Pokédex with stats, types, abilities, and evolution chains for every Pokémon.",
};

export const revalidate = 3600;

type PokedexPageProps = {
  searchParams: Promise<{
    page?: string;
    type?: string;
  }>;
};

export default async function PokedexPage({ searchParams }: PokedexPageProps) {
  const params = await searchParams;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const typeFilter = params.type;

  const validType =
    typeFilter && POKEMON_TYPES.includes(typeFilter as (typeof POKEMON_TYPES)[number])
      ? typeFilter
      : undefined;

  return (
    <main className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-bold text-4xl tracking-tight">Pokédex</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse all Pokémon with their stats, types, and evolution chains.
        </p>
      </div>

      <TypeFilter currentType={validType} />

      <Suspense fallback={<PokemonGridSkeleton />}>
        <PokemonListSection page={page} typeFilter={validType} />
      </Suspense>
    </main>
  );
}

async function PokemonListSection({
  page,
  typeFilter,
}: {
  page: number;
  typeFilter: string | undefined;
}) {
  const data = typeFilter
    ? await getPokemonByType(typeFilter, page)
    : await getPokemonList(page);

  const { pokemon, total, totalPages } = data;

  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {pokemon.length} of {total} Pokémon
        {typeFilter && (
          <>
            {" "}
            · Filtered by <span className="font-medium capitalize">{typeFilter}</span> type
          </>
        )}
      </div>

      <PokemonGrid pokemon={pokemon} />

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pokédex pagination">
          {page > 1 && (
            <Link
              className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-accent"
              href={`/pokedex?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
            >
              ← Previous
            </Link>
          )}

          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          {page < totalPages && (
            <Link
              className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-accent"
              href={`/pokedex?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
