```typescript


/**
 * Example Typesense implementation for blog search
 *
 * To use this:
 * 1. Install: npm install typesense
 * 2. Replace the content of blog-search.ts with this code
 * 3. Add your Typesense credentials to environment variables
 * 4. Create collection and index your content
 */

import Typesense from "typesense";
import type {
  BlogSearchOptions,
  BlogSearchResponse,
  BlogSearchResult,
} from "../types";

// Initialize Typesense client
const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST!,
      port: parseInt(process.env.TYPESENSE_PORT!),
      protocol: process.env.TYPESENSE_PROTOCOL!,
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 2,
});

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
    const searchResults = await client.collections("blogs").documents().search({
      q: query.trim(),
      query_by: "title,description,excerpt",
      per_page: limit,
      offset: offset,
      highlight_fields: "title,description,excerpt",
      highlight_full_fields: "title,description,excerpt",
    });

    const results: BlogSearchResult[] = searchResults.hits!.map((hit: any) => ({
      id: hit.document.id,
      title: hit.document.title,
      description: hit.document.description,
      excerpt: hit.document.excerpt,
      slug: hit.document.slug,
      url: `/blog/${hit.document.slug}`,
      image: hit.document.image
        ? {
            src: hit.document.image.src,
            alt: hit.document.image.alt || hit.document.title,
          }
        : undefined,
      publishedAt: hit.document.publishedAt,
      author: hit.document.author
        ? {
            name: hit.document.author.name,
            image: hit.document.author.image,
          }
        : undefined,
    }));

    return {
      results,
      total: searchResults.found || 0,
      query: query.trim(),
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Typesense search error:", error);
    throw new Error("Failed to search blog posts");
  }
}

// Helper function for highlighting search terms
export function highlightSearchTerms(
  text: string,
  searchTerm: string,
  className = "bg-yellow-200 dark:bg-yellow-800",
): string {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(regex, `<mark class="${className}">$1</mark>`);
}

```