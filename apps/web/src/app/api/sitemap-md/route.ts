import { client } from "@workspace/sanity/client";
import { groq } from "next-sanity";

const SITE_URL = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

interface SlugDoc {
  title: string;
  slug: string;
}

export async function GET() {
  const lines: string[] = [];

  lines.push("# Content Sitemap");
  lines.push("");
  lines.push(
    "All pages are available in markdown format by appending `.md` to the URL.",
  );
  lines.push("");

  try {
    const CONTENT_TYPES = [
      { type: "page", label: "Pages" },
      { type: "blog", label: "Blog Posts" },
    ];

    const results = await Promise.all(
      CONTENT_TYPES.map(({ type }) =>
        client.fetch<SlugDoc[]>(
          groq`*[_type == $type && defined(slug.current)] | order(title asc) {
            title,
            "slug": slug.current
          }`,
          { type },
        ),
      ),
    );

    for (let i = 0; i < CONTENT_TYPES.length; i++) {
      const { label } = CONTENT_TYPES[i]!;
      const docs = results[i]!.filter((d: SlugDoc) => d.slug);
      if (docs.length === 0) continue;

      lines.push(`## ${label}`);
      lines.push("");
      for (const doc of docs) {
        const url = `${SITE_URL}${doc.slug}`;
        const mdUrl = `${url}.md`;
        lines.push(`- [${doc.title}](${url}) ([markdown](${mdUrl}))`);
      }
      lines.push("");
    }
  } catch (error) {
    console.error("[sitemap-md] Error:", error);
  }

  lines.push("---");
  lines.push(`*Generated: ${new Date().toISOString().split("T")[0]}*`);

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
