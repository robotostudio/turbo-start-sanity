import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/lib/sanity/live";
import type {
  BlogSearchOptions,
  BlogSearchResponse,
  BlogSearchResult,
} from "./types";

// Default Sanity search query - easily replaceable
const createSearchQuery = (
  searchTerm: string,
  offset: number,
  limit: number,
) => {
  return defineQuery(`
    *[
      _type == "blog" &&
      !(_id in path("drafts.**")) &&
      (seoHideFromLists != true) &&
      (
        title match $searchTerm + "*" ||
        description match $searchTerm + "*" ||
        pt::text(richText) match $searchTerm + "*"
      )
    ] | order(_createdAt desc) [$offset...$limit] {
      _id,
      title,
      description,
      "slug": slug.current,
      publishedAt,
      image{
        asset->{
          url,
          "alt": coalesce(altText, originalFilename, "no-alt")
        }
      },
      "author": authors[0]->{
        name,
        image{
          asset->{
            url,
            "alt": coalesce(altText, originalFilename, "no-alt")
          }
        }
      },
      "excerpt": array::join(string::split(pt::text(richText), "")[0..200], "") + "..."
    }
  `);
};

const createCountQuery = (searchTerm: string) => {
  return defineQuery(`
    count(*[
      _type == "blog" &&
      !(_id in path("drafts.**")) &&
      (seoHideFromLists != true) &&
      (
        title match $searchTerm + "*" ||
        description match $searchTerm + "*" ||
        pt::text(richText) match $searchTerm + "*"
      )
    ])
  `);
};

// Transform function - customize this to match your data structure
const transformResults = (rawResults: any[]): BlogSearchResult[] => {
  return rawResults.map((blog: any) => ({
    id: blog._id,
    title: blog.title,
    description: blog.description,
    excerpt: blog.excerpt,
    slug: blog.slug,
    url: `/blog/${blog.slug}`,
    image: blog.image?.asset
      ? {
          src: blog.image.asset.url,
          alt: blog.image.asset.alt,
        }
      : undefined,
    publishedAt: blog.publishedAt,
    author: blog.author
      ? {
          name: blog.author.name,
          image: blog.author.image?.asset?.url,
        }
      : undefined,
  }));
};

/**
 * Generic blog search function
 *
 * To use with different search backends:
 * 1. Replace createSearchQuery and createCountQuery with your provider's query logic
 * 2. Replace sanityFetch with your provider's fetch function
 * 3. Update transformResults to match your data structure
 *
 * Examples:
 * - Algolia: Replace with algoliasearch client and index.search()
 * - Typesense: Replace with typesense client and collection.documents().search()
 * - Any other: Replace with your custom query logic
 */
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

  const searchTerm = query.trim();

  try {
    // Execute search and count in parallel
    const [searchResult, countResult] = await Promise.all([
      sanityFetch({
        query: createSearchQuery(searchTerm, offset, offset + limit),
        params: { searchTerm, offset, limit: offset + limit },
      }),
      sanityFetch({
        query: createCountQuery(searchTerm),
        params: { searchTerm },
      }),
    ]);

    return {
      results: transformResults(searchResult.data || []),
      total: countResult.data || 0,
      query: searchTerm,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Blog search error:", error);
    throw new Error("Failed to search blog posts");
  }
}

// Optional: Highlight search terms in results
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
