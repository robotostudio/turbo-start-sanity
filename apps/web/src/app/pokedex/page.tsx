import { Suspense } from "react";
import type { Metadata } from "next";

import { fetchPokemonList, fetchPokemonSummaries } from "@/lib/pokemon/fetcher";
import { POKEMON_PER_PAGE } from "@/lib/pokemon/constants";
import type { PokemonType } from "@/lib/pokemon/types";
import { PokemonCard } from "@/components/pokedex/pokemon-card";
import { TypeFilter } from "@/components/pokedex/type-filter";
import { BlogPagination } from "@/components/blog-pagination";
import { calculatePaginationMetadata } from "@/utils";

export const metadata: Metadata = {
  title: "Pokédex",
  description: "Browse all Pokémon with stats, types, and evolution chains.",
};

export const revalidate = 3600;

type PokedexPageProps = {
  searchParams: Promise<{
    page?: string;
    type?: string;
  }>;
};

async function fetchByType(type: string, page: number) {
  const res = await fetch(
    `https://pokeapi.co/api/v2/type/${type}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json() as { pokemon: Array<{ pokemon: { name: string } }> };
  const names = data.pokemon.map((p) => p.pokemon.name);
  const total = names.length;
  const start = (page - 1) * POKEMON_PER_PAGE;
  const slice = names.slice(start, start + POKEMON_PER_PAGE);
  return { names: slice, total };
}

export default async function PokedexPage({ searchParams }: PokedexPageProps) {
  const { page: pageParam, type: typeParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam ?? 1));
  const activeType = (typeParam as PokemonType) ?? null;

  let names: string[];
  let total: number;

  if (activeType) {
    const result = await fetchByType(activeType, currentPage);
    if (!result) {
      names = [];
      total = 0;
    } else {
      names = result.names;
      total = result.total;
    }
  } else {
    const offset = (currentPage - 1) * POKEMON_PER_PAGE;
    const list = await fetchPokemonList(POKEMON_PER_PAGE, offset);
    names = list.results.map((r) => r.name);
    total = list.count;
  }

  const summaries = await fetchPokemonSummaries(names);
  const pagination = calculatePaginationMetadata(total, currentPage, POKEMON_PER_PAGE);

  return (
    <main className="container mx-auto px-4 py-12 md:px-6">
      <header className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Pokédex</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} Pokémon — browse, filter by type, or search.
        </p>
      </header>

      <section className="mb-6">
        <Suspense>
          <TypeFilter activeType={activeType} />
        </Suspense>
      </section>

      {summaries.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No Pokémon found for this filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {summaries.map((p) => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Suspense>
            <BlogPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              basePath="/pokedex"
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
