"use client";

import { useCallback, useState } from "react";

import type { PokemonDetail, PokemonListItem } from "@/lib/pokeapi/types";
import { ComparisonStatBar } from "./stat-bar";
import { TypeBadge } from "./type-badge";

type PokemonComparisonProps = {
  currentPokemon: PokemonDetail;
};

type CompareTarget = PokemonDetail | null;

export function PokemonComparison({ currentPokemon }: PokemonComparisonProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PokemonListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [compareTarget, setCompareTarget] = useState<CompareTarget>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/pokedex/search?q=${encodeURIComponent(query)}&limit=5`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelect = useCallback(async (name: string) => {
    setIsLoadingTarget(true);
    setSearchResults([]);
    setSearchQuery("");
    try {
      const res = await fetch(`/api/pokedex/${name}`);
      if (res.ok) {
        const data = await res.json();
        setCompareTarget(data);
      }
    } catch {
      setCompareTarget(null);
    } finally {
      setIsLoadingTarget(false);
    }
  }, []);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <h2 className="font-semibold text-xl">Compare</h2>
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Search box */}
          <div className="relative">
            <input
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a Pokémon to compare..."
              type="text"
              value={searchQuery}
            />

            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => handleSelect(p.name)}
                    type="button"
                  >
                    {p.spriteUrl && (
                      <img
                        alt={p.name}
                        className="h-8 w-8 object-contain"
                        height={32}
                        src={p.spriteUrl}
                        width={32}
                      />
                    )}
                    <span className="capitalize">
                      {p.name.replace(/-/g, " ")}
                    </span>
                    <div className="ml-auto flex gap-1">
                      {p.types.map((t) => (
                        <TypeBadge key={t.name} size="sm" type={t.name} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            )}
          </div>

          {isLoadingTarget && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
            </div>
          )}

          {compareTarget && (
            <div className="space-y-4 rounded-xl border p-4">
              {/* Header: both Pokemon side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  {currentPokemon.spriteUrl && (
                    <img
                      alt={currentPokemon.name}
                      className="h-16 w-16 object-contain"
                      height={64}
                      src={currentPokemon.spriteUrl}
                      width={64}
                    />
                  )}
                  <span className="font-medium text-blue-600 text-sm capitalize">
                    {currentPokemon.name.replace(/-/g, " ")}
                  </span>
                  <div className="mt-1 flex gap-1">
                    {currentPokemon.types.map((t) => (
                      <TypeBadge key={t.name} size="sm" type={t.name} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  {compareTarget.spriteUrl && (
                    <img
                      alt={compareTarget.name}
                      className="h-16 w-16 object-contain"
                      height={64}
                      src={compareTarget.spriteUrl}
                      width={64}
                    />
                  )}
                  <span className="font-medium text-red-600 text-sm capitalize">
                    {compareTarget.name.replace(/-/g, " ")}
                  </span>
                  <div className="mt-1 flex gap-1">
                    {compareTarget.types.map((t) => (
                      <TypeBadge key={t.name} size="sm" type={t.name} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {currentPokemon.stats.map((stat, i) => (
                  <ComparisonStatBar
                    key={stat.name}
                    stat1={stat}
                    stat2={compareTarget.stats[i]!}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="font-medium">Total</span>
                <div className="flex gap-6">
                  <span className="font-bold text-blue-600 tabular-nums">
                    {currentPokemon.stats.reduce((s, st) => s + st.value, 0)}
                  </span>
                  <span className="font-bold text-red-600 tabular-nums">
                    {compareTarget.stats.reduce((s, st) => s + st.value, 0)}
                  </span>
                </div>
              </div>

              <button
                className="w-full rounded-lg border py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setCompareTarget(null)}
                type="button"
              >
                Clear comparison
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
