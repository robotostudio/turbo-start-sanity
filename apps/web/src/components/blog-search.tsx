"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import type { BlogSearchResult } from "@/lib/search/types";
import { SanityImage } from "./sanity-image";

interface BlogSearchProps {
  placeholder?: string;
  className?: string;
  onResults?: (results: BlogSearchResult[], query: string) => void;
}

interface SearchState {
  query: string;
  results: BlogSearchResult[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

function SearchResultCard({ result }: { result: BlogSearchResult }) {
  return (
    <article className="group relative flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
      {result.image && (
        <div className="relative w-full sm:w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={result.image.src}
            alt={result.image.alt}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 space-y-2">
        <h3 className="text-lg font-semibold leading-tight">
          <Link href={result.url} className="hover:text-primary">
            <span className="absolute inset-0" />
            {result.title}
          </Link>
        </h3>

        {result.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {result.description}
          </p>
        )}

        {result.excerpt && !result.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {result.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {result.publishedAt && (
            <time dateTime={result.publishedAt}>
              {new Date(result.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          )}

          {result.author && <span>{result.author.name}</span>}
        </div>
      </div>
    </article>
  );
}

export function BlogSearch({
  placeholder = "Search blog posts...",
  className = "",
  onResults,
}: BlogSearchProps) {
  const [state, setState] = useState<SearchState>({
    query: "",
    results: [],
    isLoading: false,
    error: null,
    total: 0,
  });

  const searchBlogs = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setState((prev) => ({
          ...prev,
          results: [],
          total: 0,
          error: null,
        }));
        onResults?.([], query);
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          results: data.results || [],
          total: data.total || 0,
          isLoading: false,
        }));

        onResults?.(data.results || [], query);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to search. Please try again.",
          isLoading: false,
          results: [],
          total: 0,
        }));
        onResults?.([], query);
      }
    },
    [onResults],
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBlogs(state.query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.query, searchBlogs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, query: e.target.value }));
  };

  const clearSearch = () => {
    setState((prev) => ({
      ...prev,
      query: "",
      results: [],
      total: 0,
      error: null,
    }));
    onResults?.([], "");
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={state.query}
          onChange={handleInputChange}
          className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {state.query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {state.isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin h-4 w-4" />
        )}
      </div>

      {/* Search Results */}
      {state.query && state.query.length >= 2 && (
        <div className="mt-6">
          {state.error && (
            <div className="text-center py-8 text-red-500">{state.error}</div>
          )}

          {!state.isLoading && !state.error && (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {state.total > 0
                  ? `Found ${state.total} result${state.total === 1 ? "" : "s"} for "${state.query}"`
                  : `No results found for "${state.query}"`}
              </div>

              {state.results.length > 0 && (
                <div className="space-y-4">
                  {state.results.map((result) => (
                    <SearchResultCard key={result.id} result={result} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
