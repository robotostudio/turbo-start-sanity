import type {Metadata} from "next";

import type {Maybe} from "@/types";
import {capitalize, getBaseUrl} from "@/utils";

// Site-wide configuration interface
type SiteConfig = {
  title: string;
  description: string;
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
  pageType?: Extract<Metadata["openGraph"], {type: string}>["type"];
}

// OpenGraph image generation parameters
type OgImageParams = {
  type?: string;
  id?: string;
};

// Default site configuration
const siteConfig: SiteConfig = {
  title: "JPEG Heaven",
  description: "",
  keywords: ["portfolio", "studio", "website"],
};

function generateOgImageUrl(params: OgImageParams = {}): string {
  const {type, id} = params;
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

const START_SLASH_REGEX = /^\//;

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

  console.log({pageTitle, slug, siteTitle});

  if (slug && slug !== "/") {
    return capitalize(slug.replace(START_SLASH_REGEX, ""));
  }
  return siteTitle;
}

export function getSEOMetadata(page: PageSeoData = {}): Metadata {
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

  const baseUrl = getBaseUrl();
  const pageUrl = buildPageUrl({baseUrl, slug});

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

  const titlesMatch =
    String(defaultTitle).toLowerCase() ===
    String(siteConfig.title).toLowerCase();

  let fullTitle = defaultTitle;
  if (titlesMatch) {
    fullTitle = `${siteConfig.title}`;
  } else if (slug === "/") {
    fullTitle = `${siteConfig.title} 𝌁`;
  } else {
    fullTitle = `${defaultTitle} 𝌁 ${siteConfig.title}`;
  }
  // Build default metadata object
  const defaultMetadata: Metadata = {
    title: fullTitle,
    description: defaultDescription,
    metadataBase: new URL(baseUrl),
    creator: siteConfig.title,
    authors: [{name: siteConfig.title}],
    icons: {
      icon: `${baseUrl}/favicon.ico`,
    },
    keywords: allKeywords,
    robots: seoNoIndex ? "noindex, nofollow" : "index, follow",
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
      creator: siteConfig.title,
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
