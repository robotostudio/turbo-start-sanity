import { Logger } from "@workspace/logger";
import { sanityFetch } from "@workspace/sanity/live";
import {
  queryGlobalSeoSettings,
  querySitemapData,
} from "@workspace/sanity/query";
import { absolutizeUrl } from "@workspace/sanity-blocks/internal/portable-text-to-markdown";

import { getBaseUrl } from "@/utils";

const logger = new Logger("LlmsTxt");

const BASE_URL = getBaseUrl();

function mdHref(slug: string): string {
  const path = slug.startsWith("/") ? slug : `/${slug}`;
  return absolutizeUrl(`${path}.md`, BASE_URL);
}

const PUBLISHED = { perspective: "published", stega: false } as const;

const HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
  // For agents, not search results; every entry it lists is indexable already.
  "x-robots-tag": "noindex",
} as const;

async function fetchSettings() {
  "use cache";
  const { data } = await sanityFetch({
    query: queryGlobalSeoSettings,
    ...PUBLISHED,
  });
  return data;
}

// Shares the sitemap's query — same `seoNoIndex != true` filter. Not
// `querySlugPagePaths` / `queryAllBlogDataForSearch`: those feed
// `generateStaticParams` and on-site search, which must still see noindexed docs.
async function fetchIndex() {
  "use cache";
  const { data } = await sanityFetch({
    query: querySitemapData,
    ...PUBLISHED,
  });
  return data;
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" / ");
}

export async function GET(): Promise<Response> {
  const [settingsResult, indexResult] = await Promise.allSettled([
    fetchSettings(),
    fetchIndex(),
  ]);

  if (settingsResult.status === "rejected") {
    logger.error("llms.txt: settings fetch failed", settingsResult.reason);
  }

  // Settings only decorate the header, but the index IS the document: a 200
  // with an empty one tells crawlers the site has no pages, for an hour.
  if (indexResult.status === "rejected") {
    logger.error("llms.txt: content fetch failed", indexResult.reason);
    return new Response("llms.txt is temporarily unavailable\n", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  }

  const settings =
    settingsResult.status === "fulfilled" ? settingsResult.value : null;
  const index = indexResult.value;
  const slugs = index?.slugPages ?? [];
  const posts = index?.blogPages ?? [];

  const siteTitle = settings?.siteTitle ?? "Turbo Start Sanity";
  const siteDescription = settings?.siteDescription ?? "";

  const pageLines = [
    `- [Home](${mdHref("/index")})`,
    // A singleton, not a `page`, so it is absent from the slug list above.
    `- [Blog](${mdHref("/blog")})`,
    ...slugs.flatMap(({ slug }) => {
      if (!slug) {
        return [];
      }
      const path = slug.startsWith("/") ? slug : `/${slug}`;
      return [`- [${slugToTitle(path)}](${mdHref(path)})`];
    }),
  ];

  const blogLines = posts.flatMap((post) =>
    post.slug
      ? [`- [${post.title ?? slugToTitle(post.slug)}](${mdHref(post.slug)})`]
      : []
  );

  const body = [
    `# ${siteTitle}`,
    ...(siteDescription ? [`> ${siteDescription}`] : []),
    "",
    "## Pages",
    ...pageLines,
    "",
    "## Blog",
    ...blogLines,
  ].join("\n");

  return new Response(`${body}\n`, { headers: HEADERS });
}
