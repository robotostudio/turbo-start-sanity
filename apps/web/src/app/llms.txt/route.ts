import { Logger } from "@workspace/logger";
import { sanityFetch } from "@workspace/sanity/live";
import {
  queryAllBlogDataForSearch,
  queryGlobalSeoSettings,
  querySlugPagePaths,
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
} as const;

async function fetchSettings() {
  "use cache";
  const { data } = await sanityFetch({
    query: queryGlobalSeoSettings,
    ...PUBLISHED,
  });
  return data;
}

async function fetchSlugs() {
  "use cache";
  const { data } = await sanityFetch({
    query: querySlugPagePaths,
    ...PUBLISHED,
  });
  return data;
}

async function fetchPosts() {
  "use cache";
  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
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
  const [settingsResult, slugsResult, postsResult] = await Promise.allSettled([
    fetchSettings(),
    fetchSlugs(),
    fetchPosts(),
  ]);

  if (settingsResult.status === "rejected") {
    logger.error("llms.txt: settings fetch failed", settingsResult.reason);
  }
  if (slugsResult.status === "rejected") {
    logger.error("llms.txt: page slugs fetch failed", slugsResult.reason);
  }
  if (postsResult.status === "rejected") {
    logger.error("llms.txt: blog posts fetch failed", postsResult.reason);
  }

  const settings =
    settingsResult.status === "fulfilled" ? settingsResult.value : null;
  const slugs =
    slugsResult.status === "fulfilled" ? (slugsResult.value ?? []) : [];
  const posts =
    postsResult.status === "fulfilled" ? (postsResult.value ?? []) : [];

  const siteTitle = settings?.siteTitle ?? "Turbo Start Sanity";
  const siteDescription = settings?.siteDescription ?? "";

  const pageLines = [
    `- [Home](${mdHref("/index")})`,
    ...slugs
      .filter((s): s is string => Boolean(s))
      .map((slug) => {
        const path = slug.startsWith("/") ? slug : `/${slug}`;
        return `- [${slugToTitle(path)}](${mdHref(path)})`;
      }),
  ];

  const sortedPosts = [...posts].sort((a, b) =>
    (a.orderRank ?? "").localeCompare(b.orderRank ?? "")
  );

  const blogLines = sortedPosts.flatMap((post) =>
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
