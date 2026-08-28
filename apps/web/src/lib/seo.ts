import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import { queryGlobalSeoSettings } from "@workspace/sanity/query";
import type { Metadata } from "next";

import type { Maybe } from "@/types";
import { capitalize, getBaseUrl } from "@/utils";

type SiteConfig = {
  title: string;
  description: string;
  twitterHandle: string;
  keywords: string[];
  favicon?: string | null;
  ogImage?: string | null;
};

type PageSeoData = Metadata & {
  title?: string;
  description?: string;
  ogTitle?: Maybe<string>;
  ogDescription?: Maybe<string>;
  ogImage?: Maybe<string>;
  slug?: string;
  keywords?: string[];
  seoNoIndex?: boolean;
  pageType?: Extract<Metadata["openGraph"], { type: string }>["type"];
};

const FALLBACK_SITE_CONFIG: SiteConfig = {
  title: "Turbo Start Sanity",
  description: "Turbo Start Sanity",
  twitterHandle: "@studioroboto",
  keywords: ["roboto", "studio", "demo", "sanity", "next", "react", "template"],
};

async function resolveSiteConfig(): Promise<SiteConfig> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: settings } = await sanityFetchMetadata({
    query: queryGlobalSeoSettings,
    perspective,
  });
  const twitter = settings?.socialLinks?.twitter?.split("/").findLast(Boolean);
  return {
    title: settings?.siteTitle || FALLBACK_SITE_CONFIG.title,
    description: settings?.siteDescription || FALLBACK_SITE_CONFIG.description,
    twitterHandle: twitter ? `@${twitter}` : FALLBACK_SITE_CONFIG.twitterHandle,
    keywords: FALLBACK_SITE_CONFIG.keywords,
    favicon: settings?.favicon ?? null,
    ogImage: settings?.ogImage ?? null,
  };
}

function buildPageUrl({
  baseUrl,
  slug,
}: {
  baseUrl: string;
  slug: string;
}): string {
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  return `${baseUrl}${normalizedSlug}`;
}

function extractTitle({
  pageTitle,
  slug,
  siteTitle,
}: {
  pageTitle?: Maybe<string>;
  slug: string;
  siteTitle: string;
}): string {
  if (pageTitle) {
    return pageTitle;
  }
  if (slug && slug !== "/") {
    return capitalize(slug.replace(/^\//, ""));
  }
  return siteTitle;
}

type SeoSourceDocument = {
  title?: string | null;
  seoTitle?: string | null;
  description?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  seoNoIndex?: boolean | null;
  _id?: string | null;
  _type?: string | null;
};

/**
 * Maps a fetched Sanity document to page metadata, applying the shared
 * `title ?? seoTitle` / `description ?? seoDescription` fallback used by every
 * route's `generateMetadata`.
 */
export function seoFromDocument(
  doc: SeoSourceDocument | null | undefined,
  { slug, pageType }: { slug: string; pageType?: PageSeoData["pageType"] }
): Promise<Metadata> {
  return getSEOMetadata({
    title: doc?.title ?? doc?.seoTitle ?? undefined,
    description: doc?.description ?? doc?.seoDescription ?? undefined,
    ogTitle: doc?.ogTitle,
    ogDescription: doc?.ogDescription,
    ogImage: doc?.ogImage,
    seoNoIndex: doc?.seoNoIndex ?? false,
    slug,
    pageType,
  });
}

export async function getSEOMetadata(
  page: PageSeoData = {}
): Promise<Metadata> {
  const {
    title: pageTitle,
    description: pageDescription,
    ogTitle,
    ogDescription,
    ogImage: pageOgImage,
    slug = "/",
    keywords: pageKeywords = [],
    seoNoIndex = false,
    pageType = "website",
    ...pageOverrides
  } = page;

  const siteConfig = await resolveSiteConfig();
  const baseUrl = getBaseUrl();
  const pageUrl = buildPageUrl({ baseUrl, slug });

  const defaultTitle = extractTitle({
    pageTitle,
    slug,
    siteTitle: siteConfig.title,
  });
  const defaultDescription = pageDescription || siteConfig.description;
  const socialTitle = ogTitle || defaultTitle;
  const socialDescription = ogDescription || defaultDescription;
  const allKeywords = [...siteConfig.keywords, ...pageKeywords];

  // Per-page image wins, else the Settings default; neither = no OG image.
  const ogImage = pageOgImage ?? siteConfig.ogImage ?? undefined;
  const ogImages = ogImage
    ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: socialTitle,
          secureUrl: ogImage,
        },
      ]
    : undefined;

  // "Page / Site" tab titles; bare site title when they are one and the same
  // (the homepage), so it never reads "Site / Site".
  const fullTitle =
    defaultTitle === siteConfig.title
      ? defaultTitle
      : `${defaultTitle} / ${siteConfig.title}`;

  const markdownUrl =
    slug && slug !== "/" ? `${pageUrl}.md` : `${baseUrl}/index.md`;
  const markdownTypes = seoNoIndex
    ? undefined
    : { "text/markdown": [{ url: markdownUrl, title: fullTitle }] };

  const defaultMetadata: Metadata = {
    title: fullTitle,
    description: defaultDescription,
    metadataBase: new URL(baseUrl),
    creator: siteConfig.title,
    authors: [{ name: siteConfig.title }],
    // The fallback pair lives in `public/`, not `app/`: a `favicon.ico` under
    // `app/` is a Next file convention and gets its own <link> injected next to
    // this one, which can outrank the Sanity icon.
    icons: {
      icon: siteConfig.favicon
        ? [{ url: siteConfig.favicon }]
        : [
            { url: `${baseUrl}/favicon.svg`, type: "image/svg+xml" },
            { url: `${baseUrl}/favicon.ico`, sizes: "16x16 32x32 48x48" },
          ],
    },
    keywords: allKeywords,
    robots: seoNoIndex ? "noindex, nofollow" : "index, follow",
    twitter: {
      card: "summary_large_image",
      images: ogImage ? [ogImage] : undefined,
      creator: siteConfig.twitterHandle,
      title: socialTitle,
      description: socialDescription,
    },
    alternates: {
      canonical: pageUrl,
      types: markdownTypes,
    },
    openGraph: {
      type: pageType ?? "website",
      countryName: "UK",
      description: socialDescription,
      title: socialTitle,
      siteName: siteConfig.title,
      images: ogImages,
      url: pageUrl,
    },
  };

  const { alternates: alternatesOverride, ...restOverrides } = pageOverrides;
  return {
    ...defaultMetadata,
    ...restOverrides,
    alternates: { ...defaultMetadata.alternates, ...alternatesOverride },
  };
}
