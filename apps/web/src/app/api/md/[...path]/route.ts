import { client } from "@workspace/sanity/client";
import {
  queryBlogIndexPageData,
  queryBlogSlugPageData,
  queryHomePageData,
  querySlugPageData,
} from "@workspace/sanity/query";
import { groq } from "next-sanity";

import { formatDocumentAsMarkdown } from "@/lib/markdown/formatter";

/** Fetch all blog posts for the blog index markdown page. */
const allBlogsQuery = groq`
  *[_type == "blog" && defined(slug.current)] | order(publishedAt desc) {
    title,
    description,
    "slug": slug.current,
    publishedAt
  }
`;

/** GROQ query that resolves a slug.current to its _type. */
const detectTypeQuery = groq`
  *[defined(slug.current) && slug.current == $slug][0]._type
`;

/** Map from Sanity _type to the query that fetches the full document. */
const TYPE_QUERY_MAP: Record<string, string> = {
  page: querySlugPageData,
  blog: queryBlogSlugPageData,
};

/** Singleton types that use {} params (no slug needed). */
const SINGLETON_TYPES: Record<string, string> = {
  homePage: queryHomePageData,
  blogIndex: queryBlogIndexPageData,
};

/** Known URL paths that map to singleton types (fallback when slug detection fails). */
const PATH_TO_SINGLETON: Record<string, string> = {
  "/blog": "blogIndex",
};

/**
 * API route that renders any Sanity page as Markdown.
 * Resolves the slug to a _type, selects the appropriate query,
 * fetches the document, and formats it with formatDocumentAsMarkdown.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const slug = `/${path.join("/")}`;

  try {
    let documentType: string | null = await client.fetch(detectTypeQuery, {
      slug,
    });

    // Fallback: check known URL-to-singleton mappings
    if (!documentType && slug in PATH_TO_SINGLETON) {
      documentType = PATH_TO_SINGLETON[slug]!;
    }

    if (!documentType) {
      return new Response("Page not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const isSingleton = documentType in SINGLETON_TYPES;
    const query =
      TYPE_QUERY_MAP[documentType] ?? SINGLETON_TYPES[documentType];

    if (!query) {
      return new Response("Page not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const rawData = await client.fetch(query, isSingleton ? {} : { slug });
    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!data) {
      return new Response("Page not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // For blogIndex, attach the actual blog posts to the data
    if (documentType === "blogIndex") {
      const blogs = await client.fetch(allBlogsQuery);
      data.blogs = blogs;
    }

    const markdown = formatDocumentAsMarkdown({ type: documentType, data });

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type": documentType,
      },
    });
  } catch (error) {
    console.error("[api/md] Error:", error);
    return new Response("Failed to render page as markdown", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
