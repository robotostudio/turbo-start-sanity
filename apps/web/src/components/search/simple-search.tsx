'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { searchClient, algoliaConfig } from '@/lib/algolia/config';
import { BlogCard } from '@/components/blog-card';
import type { QueryBlogIndexPageDataResult } from '@/lib/sanity/sanity.types';

interface SimpleSearchProps {
  blogs: NonNullable<QueryBlogIndexPageDataResult>['blogs'];
  className?: string;
}

interface SearchResult {
  objectID: string;
  _id: string;
  _type: string;
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  authors?: Array<{ name: string; position: string }>;
  imageUrl?: string;
  imageAlt?: string;
  richText: any[];
  orderRank: string;
}

export function SimpleSearch({ blogs, className = '' }: SimpleSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResponse = await searchClient.search([
        {
          indexName: algoliaConfig.indexName,
          query: searchQuery,
          params: {
            hitsPerPage: 20,
            attributesToRetrieve: [
              'objectID',
              '_id',
              '_type',
              'title',
              'description',
              'slug',
              'publishedAt',
              'authors',
              'imageUrl',
              'imageAlt',
              'richText',
              'orderRank',
            ],
          },
        },
      ]);

      console.log("searchResponse", searchResponse);

      // Check if we have results and extract hits
      if (searchResponse.results && searchResponse.results.length > 0) {
        const firstResult = searchResponse.results[0];
        if (firstResult && 'hits' in firstResult && Array.isArray(firstResult.hits)) {
          setResults(firstResult.hits as SearchResult[]);
        } else {
          setResults([]);
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  // Auto-search after user stops typing (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== '') {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search blog posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">Search Error</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Searching...</p>
        </div>
      )}

      {/* Search Results */}
      {query && !isLoading && !error && (
        <div className="space-y-6">
          {results.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                  <BlogCard
                    key={result.objectID}
                    blog={{
                      _id: result._id,
                      _type: result._type as 'blog',
                      title: result.title,
                      description: result.description,
                      slug: result.slug,
                      publishedAt: result.publishedAt,
                      authors: result.authors ? {
                        _id: result.authors[0]?.name || '',
                        name: result.authors[0]?.name || '',
                        position: result.authors[0]?.position || null,
                        image: null,
                      } : null,
                      image: result.imageUrl ? {
                        asset: {
                          _ref: result.imageUrl,
                          _type: 'reference' as const,
                        },
                        _type: 'image' as const,
                        alt: result.imageAlt || 'no-alt',
                        blurData: null,
                        dominantColor: null,
                      } : {
                        asset: undefined,
                        _type: 'image' as const,
                      },
                      richText: result.richText || [],
                      orderRank: result.orderRank || '',
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all blog posts below.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regular Blog List (shown when no search or no results) */}
      {(!query || results.length === 0) && !isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}
