import { client } from "@workspace/sanity/client";
import { groq } from "next-sanity";

const SITE_URL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const MAX_LENGTH = 80;

function truncate(text: string): string {
  if (text.length <= MAX_LENGTH) return text;
  return `${text.substring(0, MAX_LENGTH - 3).trim()}...`;
}

function escapeMarkdownLink(text: string): string {
  return text.replace(/[[\]()]/g, "\\$&");
}

export async function GET() {
  const lines: string[] = [];

  lines.push("# Turbo Start Sanity");
  lines.push("");
  lines.push("> A modern web application built with Next.js and Sanity CMS.");
  lines.push("");
  lines.push("## About");
  lines.push("");
  lines.push(`- Website: ${SITE_URL}`);
  lines.push(`- Contact: ${SITE_URL}/contact`);
  lines.push(`- Sitemap: ${SITE_URL}/sitemap.md`);
  lines.push("");

  try {
    const [blogs, pages] = await Promise.all([
      client.fetch<{ title: string; slug: string; description?: string }[]>(
        groq`*[_type == "blog"] | order(publishedAt desc) [0...20] { title, "slug": slug.current, description }`,
      ),
      client.fetch<{ title: string; slug: string }[]>(
        groq`*[_type == "page" && defined(slug.current)] | order(title asc) { title, "slug": slug.current }`,
      ),
    ]);

    if (pages.length > 0) {
      lines.push("## Pages");
      lines.push("");
      for (const item of pages) {
        if (!item.slug) continue;
        const url = `${SITE_URL}${item.slug}`;
        const mdUrl = `${url}.md`;
        lines.push(
          `- [${escapeMarkdownLink(item.title)}](${url}) - [markdown](${mdUrl})`,
        );
      }
      lines.push("");
    }

    if (blogs.length > 0) {
      lines.push("## Blog Posts (Recent)");
      lines.push("");
      for (const item of blogs) {
        if (!item.slug) continue;
        const url = `${SITE_URL}${item.slug}`;
        const mdUrl = `${url}.md`;
        const desc = item.description
          ? ` - ${truncate(item.description)}`
          : "";
        lines.push(
          `- [${escapeMarkdownLink(item.title)}](${url}) - [markdown](${mdUrl})${desc}`,
        );
      }
      lines.push("");
    }
  } catch (error) {
    console.error("[llms-txt] Error fetching content:", error);
  }

  lines.push("## Technical Details");
  lines.push("");
  lines.push("- Built with: Next.js, React, Sanity CMS, TypeScript");
  lines.push("- Markdown versions available at any URL + .md suffix");
  lines.push(`- Content sitemap: ${SITE_URL}/sitemap.md`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "*This file follows the llms.txt standard for LLM agent discovery*",
  );
  lines.push(`*Last built: ${new Date().toISOString().split("T")[0]}*`);
  lines.push("");

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
