/**
 * Normalize URLs in markdown content for AI agent consumption.
 * Converts relative internal links to absolute URLs.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

/**
 * Normalize relative URLs to absolute URLs in markdown.
 * @param markdown - Markdown content with relative links
 * @returns Markdown with all links made absolute
 */
export function normalizeMarkdownUrls(markdown: string): string {
  return markdown.replace(
    /\[([^\]]+)\]\(\/((?:\([^()]*\)|[^()])*)\)/g,
    `[$1](${SITE_URL}/$2)`,
  );
}
