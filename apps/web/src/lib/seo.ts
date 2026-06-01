import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@workspace/sanity/live";
import { queryGlobalSeoSettings } from "@workspace/sanity/query";
import type { Metadata } from "next";

import type { Maybe } from "@/types";
import { capitalize, getBaseUrl } from "@/utils";

// Site-wide configuration interface
type SiteConfig = {
  title: string;
  description: string;
  twitterHandle: string;
  keywords: string[];
};

// Page-specific SEO data interface
interface PageSeoData extends Metadata {
  title?: string;
  description?: string;
  slug?: string;
  contentId?: string;
  contentType?: string;
  keywords?: string[];
  seoNoIndex?: boolean;
  pageType?: Extract<Metadata["openGraph"], { type: string }>["type"];
}

// OpenGraph image generation parameters
type OgImageParams = {
  type?: string;
  id?: string;
};

// Fallbacks used until the Settings document is populated in the Studio
const FALLBACK_SITE_CONFIG: SiteConfig = {
  title: "Roboto Studio Demo",
  description: "Roboto Studio Demo",
  twitterHandle: "@studioroboto",
  keywords: ["roboto", "studio", "demo", "sanity", "next", "react", "template"],
};

// Pulls site-wide config from the Sanity Settings document, with fallbacks
async function resolveSiteConfig(): Promise<SiteConfig> {
  const { perspective } = await getDynamicFetchOptions();
  const { data: settings } = await sanityFetchMetadata({
    query: queryGlobalSeoSettings,
    perspective,
  });
  const twitter = settings?.socialLinks?.twitter
    ?.split("/")
    .filter(Boolean)
    .pop();
  return {
    title: settings?.siteTitle || FALLBACK_SITE_CONFIG.title,
    description: settings?.siteDescription || FALLBACK_SITE_CONFIG.description,
    twitterHandle: twitter ? `@${twitter}` : FALLBACK_SITE_CONFIG.twitterHandle,
    keywords: FALLBACK_SITE_CONFIG.keywords,
  };
}

function generateOgImageUrl(params: OgImageParams = {}): string {
  const { type, id } = params;
  const searchParams = new URLSearchParams();

  if (id) {
    searchParams.set("id", id);
  }
  if (type) {
    searchParams.set("type", type);
  }

  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/og?${searchParams.toString()}`;
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

export async function getSEOMetadata(
  page: PageSeoData = {}
): Promise<Metadata> {
  const {
    title: pageTitle,
    description: pageDescription,
    slug = "/",
    contentId,
    contentType,
    keywords: pageKeywords = [],
    seoNoIndex = false,
    pageType = "website",
    ...pageOverrides
  } = page;

  const siteConfig = await resolveSiteConfig();
  const baseUrl = getBaseUrl();
  const pageUrl = buildPageUrl({ baseUrl, slug });

  // Build default metadata values
  const defaultTitle = extractTitle({
    pageTitle,
    slug,
    siteTitle: siteConfig.title,
  });
  const defaultDescription = pageDescription || siteConfig.description;
  const allKeywords = [...siteConfig.keywords, ...pageKeywords];

  const ogImage = generateOgImageUrl({
    type: contentType,
    id: contentId,
  });

  const fullTitle =
    defaultTitle === siteConfig.title
      ? defaultTitle
      : `${defaultTitle} | ${siteConfig.title}`;

  // Build default metadata object
  const defaultMetadata: Metadata = {
    title: fullTitle,
    description: defaultDescription,
    metadataBase: new URL(baseUrl),
    creator: siteConfig.title,
    authors: [{ name: siteConfig.title }],
    icons: {
      icon: `${baseUrl}/favicon.ico`,
    },
    keywords: allKeywords,
    robots: seoNoIndex ? "noindex, nofollow" : "index, follow",
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
      creator: siteConfig.twitterHandle,
      title: defaultTitle,
      description: defaultDescription,
    },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: pageType ?? "website",
      countryName: "UK",
      description: defaultDescription,
      title: defaultTitle,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: defaultTitle,
          secureUrl: ogImage,
        },
      ],
      url: pageUrl,
    },
  };

  // Override any defaults with page-specific metadata
  return {
    ...defaultMetadata,
    ...pageOverrides,
  };
}
