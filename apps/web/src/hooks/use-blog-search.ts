import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { SearchablePokemon } from "@/lib/pokemon/types";
import type { Blog } from "@/types";
import { useDebounce } from "./use-debounce";

const SEARCH_DEBOUNCE_MS = 400;
const CACHE_STALE_TIME_MS = 30_000;

type SearchPayload = {
  results: Blog[];
  pokemon: SearchablePokemon[];
};

async function searchAll(query: string, signal: AbortSignal): Promise<SearchPayload> {
  if (!query.trim()) {
    return { results: [], pokemon: [] };
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to search");
  }

  const payload = (await response.json()) as {
    results?: Blog[];
    pokemon?: SearchablePokemon[];
  };

  return {
    results: payload.results ?? [],
    pokemon: payload.pokemon ?? [],
  };
}

export function useBlogSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const hasQuery = debouncedQuery.trim().length > 0;
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-search", debouncedQuery],
    queryFn: ({ signal }) => searchAll(debouncedQuery, signal),
    enabled: hasQuery,
    staleTime: CACHE_STALE_TIME_MS,
  });
  return {
    searchQuery,
    setSearchQuery,
    results: data?.results ?? [],
    pokemon: data?.pokemon ?? [],
    isSearching: isLoading,
    error,
    hasQuery,
  };
}
