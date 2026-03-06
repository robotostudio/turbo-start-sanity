import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import type { Blog } from "@/types";
import { useDebounce } from "./use-debounce";

const SEARCH_DEBOUNCE_MS = 400;
const CACHE_STALE_TIME_MS = 30_000;

type SearchFacets = {
  categories: Array<{ key: string; count: number }>;
  authors: Array<{ key: string; count: number }>;
  dateRanges: Array<{ key: string; from?: string; to?: string; count: number }>;
};

type SearchFilters = {
  category?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
};

type SearchResponse = {
  hits: Array<
    Blog & {
      authorName?: string | null;
      authorId?: string | null;
      seoHideFromLists?: boolean;
      _highlight?: Record<string, string[]>;
    }
  >;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
  source: "opensearch" | "fallback";
};

async function searchBlog(
  query: string,
  filters: SearchFilters,
  signal: AbortSignal,
): Promise<SearchResponse> {
  if (!query.trim()) {
    return {
      hits: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      facets: { categories: [], authors: [], dateRanges: [] },
      source: "opensearch",
    };
  }

  const params = new URLSearchParams({ q: query, limit: "10" });
  if (filters.category) params.set("category", filters.category);
  if (filters.author) params.set("author", filters.author);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const response = await fetch(`/api/search?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error("Failed to search");
  }

  return response.json() as Promise<SearchResponse>;
}

function mapHitsToBlog(
  hits: SearchResponse["hits"],
): Blog[] {
  return hits.map((hit) => ({
    _type: hit._type,
    _id: hit._id,
    title: hit.title,
    description: hit.description,
    slug: hit.slug,
    orderRank: hit.orderRank ?? null,
    image: hit.image,
    publishedAt: hit.publishedAt,
    authors: hit.authors,
  }));
}

export function useBlogSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const debouncedQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const hasQuery = debouncedQuery.trim().length > 0;
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-search", debouncedQuery, filters],
    queryFn: ({ signal }) => searchBlog(debouncedQuery, filters, signal),
    enabled: hasQuery,
    staleTime: CACHE_STALE_TIME_MS,
  });

  const setCategoryFilter = useCallback((category: string | undefined) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const setAuthorFilter = useCallback((author: string | undefined) => {
    setFilters((prev) => ({ ...prev, author }));
  }, []);

  const setDateFilter = useCallback(
    (dateFrom: string | undefined, dateTo: string | undefined) => {
      setFilters((prev) => ({ ...prev, dateFrom, dateTo }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    results: data ? mapHitsToBlog(data.hits) : [],
    total: data?.total ?? 0,
    isSearching: isLoading,
    error,
    hasQuery,
    facets: data?.facets ?? { categories: [], authors: [], dateRanges: [] },
    filters,
    setCategoryFilter,
    setAuthorFilter,
    setDateFilter,
    clearFilters,
    source: data?.source ?? null,
  };
}
