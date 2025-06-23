```typescript

/**
 * Example Algolia implementation for blog search
 *
 * To use this:
 * 1. Install: npm install algoliasearch
 * 2. Replace the content of blog-search.ts with this code
 * 3. Add your Algolia credentials to environment variables
 * 4. Index your content using the indexing script
 */

import algoliasearch from "algoliasearch";
import type {
  BlogSearchOptions,
  BlogSearchResponse,
  BlogSearchResult,
} from "../types";

// Initialize Algolia client
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!,
);
const index = client.initIndex("blogs");

export async function searchBlogs(
  options: BlogSearchOptions,
): Promise<BlogSearchResponse> {
  const startTime = Date.now();
  const { query, limit = 10, offset = 0 } = options;

  // Early return for invalid queries
  if (!query || query.trim().length < 2) {
    return {
      results: [],
      total: 0,
      query: query?.trim() || "",
      processingTime: Date.now() - startTime,
    };
  }

  try {
    const searchResults = await index.search(query.trim(), {
      hitsPerPage: limit,
      offset: offset,
      attributesToHighlight: ["title", "description", "excerpt"],
      highlightPreTag: "<mark>",
      highlightPostTag: "</mark>",
    });

    const results: BlogSearchResult[] = searchResults.hits.map((hit: any) => ({
      id: hit.objectID,
      title: hit.title,
      description: hit.description,
      excerpt: hit.excerpt,
      slug: hit.slug,
      url: `/blog/${hit.slug}`,
      image: hit.image
        ? {
            src: hit.image.src,
            alt: hit.image.alt || hit.title,
          }
        : undefined,
      publishedAt: hit.publishedAt,
      author: hit.author
        ? {
            name: hit.author.name,
            image: hit.author.image,
          }
        : undefined,
    }));

    return {
      results,
      total: searchResults.nbHits,
      query: query.trim(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Algolia search error:", error);
    throw new Error("Failed to search blog posts");
  }
}

// Optional: Helper function for highlighting search terms (Algolia handles this automatically)
export function highlightSearchTerms(text: string, searchTerm: string): string {
  // Algolia returns pre-highlighted text, so we can just return it as-is
  return text;
}


```