import { client } from "@workspace/sanity/client";
import { queryHomePageData } from "@workspace/sanity/query";

import { formatDocumentAsMarkdown } from "@/lib/markdown/formatter";

/**
 * Homepage markdown handler.
 * /.md rewrites to /api/md (this file).
 * Fetches the homePage singleton and formats it as markdown.
 */
export async function GET() {
  try {
    const data = await client.fetch(queryHomePageData);

    if (!data) {
      return new Response("Homepage not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const markdown = formatDocumentAsMarkdown({
      type: "homePage",
      data,
    });

    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type": "homePage",
      },
    });
  } catch (error) {
    console.error("[api/md] Homepage error:", error);
    return new Response("Failed to render homepage as markdown", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
