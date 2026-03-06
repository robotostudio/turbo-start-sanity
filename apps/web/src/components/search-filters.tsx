"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Filter, X } from "lucide-react";
import { useState } from "react";

type SearchFacets = {
  categories: Array<{ key: string; count: number }>;
  authors: Array<{ key: string; count: number }>;
  dateRanges: Array<{
    key: string;
    from?: string;
    to?: string;
    count: number;
  }>;
};

type SearchFilters = {
  category?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
};

type SearchFiltersProps = {
  className?: string;
  facets: SearchFacets;
  filters: SearchFilters;
  onCategoryChange: (category: string | undefined) => void;
  onAuthorChange: (author: string | undefined) => void;
  onDateChange: (from: string | undefined, to: string | undefined) => void;
  onClearFilters: () => void;
};

export function SearchFilters({
  className,
  facets,
  filters,
  onCategoryChange,
  onAuthorChange,
  onDateChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters =
    filters.category || filters.author || filters.dateFrom || filters.dateTo;
  const hasAvailableFacets =
    facets.categories.length > 0 ||
    facets.authors.length > 0 ||
    facets.dateRanges.length > 0;

  if (!hasAvailableFacets && !hasActiveFilters) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            isOpen
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
          )}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {(filters.category ? 1 : 0) +
                (filters.author ? 1 : 0) +
                (filters.dateFrom || filters.dateTo ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-1.5 text-destructive text-xs transition-colors hover:bg-destructive/10"
            onClick={onClearFilters}
            type="button"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}

        {/* Active filter pills */}
        {filters.category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
            Category: {filters.category}
            <button
              aria-label={`Remove category filter: ${filters.category}`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => onCategoryChange(undefined)}
              type="button"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}

        {filters.author && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
            Author: {filters.author}
            <button
              aria-label={`Remove author filter: ${filters.author}`}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => onAuthorChange(undefined)}
              type="button"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}

        {(filters.dateFrom || filters.dateTo) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
            Date range
            <button
              aria-label="Remove date filter"
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => onDateChange(undefined, undefined)}
              type="button"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
      </div>

      {isOpen && (
        <div className="grid gap-6 rounded-lg border border-border bg-card p-4 md:grid-cols-3">
          {/* Category facets */}
          {facets.categories.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-foreground text-sm">
                Category
              </h4>
              <div className="space-y-1">
                {facets.categories.map((category) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      filters.category === category.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    key={category.key}
                    onClick={() =>
                      onCategoryChange(
                        filters.category === category.key
                          ? undefined
                          : category.key,
                      )
                    }
                    type="button"
                  >
                    <span>{category.key}</span>
                    <span className="text-xs opacity-60">
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Author facets */}
          {facets.authors.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-foreground text-sm">
                Author
              </h4>
              <div className="space-y-1">
                {facets.authors.map((author) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      filters.author === author.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    key={author.key}
                    onClick={() =>
                      onAuthorChange(
                        filters.author === author.key
                          ? undefined
                          : author.key,
                      )
                    }
                    type="button"
                  >
                    <span>{author.key}</span>
                    <span className="text-xs opacity-60">
                      ({author.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date range facets */}
          {facets.dateRanges.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-foreground text-sm">
                Date Range
              </h4>
              <div className="space-y-1">
                {facets.dateRanges
                  .filter((range) => range.count > 0)
                  .map((range) => {
                    const isActive =
                      filters.dateFrom === range.from &&
                      filters.dateTo === range.to;
                    return (
                      <button
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        key={range.key}
                        onClick={() =>
                          isActive
                            ? onDateChange(undefined, undefined)
                            : onDateChange(range.from, range.to)
                        }
                        type="button"
                      >
                        <span>{range.key}</span>
                        <span className="text-xs opacity-60">
                          ({range.count})
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
