import { urlFor } from "@workspace/sanity/client";
import type {
  QueryBlogSlugPageDataResult,
  QuerySettingsDataResult,
} from "@workspace/sanity/types";
import { stegaClean } from "next-sanity";
import type {
  Article,
  ContactPoint,
  ImageObject,
  Organization,
  Person,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { getJsonLdSettings } from "@/lib/json-ld-data";
import { getBaseUrl } from "@/utils";

// Escape <, >, & to \uXXXX so a "</script>" in any CMS field can't break out of
// the tag. JSON-LD is parsed as data (not executed), so escaping < is what
// matters; the result stays valid JSON for crawlers.
function serializeJsonLd<T>(data: T): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function JsonLdScript<T>({ data, id }: { data: T; id: string }) {
  return (
    <script
      // Raw injection is required so the JSON-LD reaches crawlers unescaped;
      // serializeJsonLd already escapes <, >, & to prevent script breakout.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  );
}

const IMAGE_SIZE_WIDTH = 1920;
const IMAGE_SIZE_HEIGHT = 1080;
const IMAGE_QUALITY = 80;

function buildSafeImageUrl(image?: { id?: string | null }) {
  if (!image?.id) {
    return;
  }
  return urlFor({ ...image, _id: image.id })
    .size(IMAGE_SIZE_WIDTH, IMAGE_SIZE_HEIGHT)
    .dpr(2)
    .auto("format")
    .quality(IMAGE_QUALITY)
    .url();
}

// Article JSON-LD Component
type ArticleJsonLdProps = {
  article: QueryBlogSlugPageDataResult;
  settings?: QuerySettingsDataResult;
};
export function ArticleJsonLd({
  article: rawArticle,
  settings,
}: ArticleJsonLdProps) {
  if (!rawArticle) {
    return null;
  }
  const article = stegaClean(rawArticle);

  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}${article.slug}`;
  const imageUrl = buildSafeImageUrl(article.image);

  const articleJsonLd: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description || undefined,
    image: imageUrl ? [imageUrl] : undefined,
    author: article.authors
      ? [
          {
            "@type": "Person",
            name: article.authors.name,
            url: `${baseUrl}`,
            image: article.authors.image
              ? ({
                  "@type": "ImageObject",
                  url: buildSafeImageUrl(article.authors.image),
                } as ImageObject)
              : undefined,
          } as Person,
        ]
      : [],
    publisher: {
      "@type": "Organization",
      name: settings?.siteTitle || "Website",
      logo: settings?.logo
        ? ({
            "@type": "ImageObject",
            url: settings.logo,
          } as ImageObject)
        : undefined,
    } as Organization,
    datePublished: new Date(
      article.publishedAt || article._createdAt || new Date().toISOString()
    ).toISOString(),
    dateModified: new Date(
      article._updatedAt || new Date().toISOString()
    ).toISOString(),
    url: articleUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    } as WebPage,
  };

  return (
    <JsonLdScript data={articleJsonLd} id={`article-json-ld-${article.slug}`} />
  );
}

// Organization JSON-LD Component
type OrganizationJsonLdProps = {
  settings: QuerySettingsDataResult;
};

export function OrganizationJsonLd({ settings }: OrganizationJsonLdProps) {
  if (!settings) {
    return null;
  }

  const baseUrl = getBaseUrl();

  const socialLinks = settings.socialLinks
    ? (Object.values(settings.socialLinks).filter(Boolean) as string[])
    : undefined;

  const organizationJsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteTitle,
    description: settings.siteDescription || undefined,
    url: baseUrl,
    logo: settings.logo
      ? ({
          "@type": "ImageObject",
          url: settings.logo,
        } as ImageObject)
      : undefined,
    contactPoint: settings.contactEmail
      ? ({
          "@type": "ContactPoint",
          email: settings.contactEmail,
          contactType: "customer service",
        } as ContactPoint)
      : undefined,
    sameAs: socialLinks?.length ? socialLinks : undefined,
  };

  return <JsonLdScript data={organizationJsonLd} id="organization-json-ld" />;
}

// Website JSON-LD Component
type WebSiteJsonLdProps = {
  settings: QuerySettingsDataResult;
};

export function WebSiteJsonLd({ settings }: WebSiteJsonLdProps) {
  if (!settings) {
    return null;
  }

  const baseUrl = getBaseUrl();

  const websiteJsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteTitle,
    description: settings.siteDescription || undefined,
    url: baseUrl,
    publisher: {
      "@type": "Organization",
      name: settings.siteTitle,
    } as Organization,
  };

  return <JsonLdScript data={websiteJsonLd} id="website-json-ld" />;
}

// Combined JSON-LD Component for pages with multiple structured data
type CombinedJsonLdProps = {
  settings?: QuerySettingsDataResult;
  article?: QueryBlogSlugPageDataResult;
  includeWebsite?: boolean;
  includeOrganization?: boolean;
};

export async function CombinedJsonLd({
  includeWebsite = false,
  includeOrganization = false,
}: CombinedJsonLdProps) {
  const res = await getJsonLdSettings();

  const cleanSettings = stegaClean(res);
  return (
    <>
      {includeWebsite && cleanSettings && (
        <WebSiteJsonLd settings={cleanSettings} />
      )}
      {includeOrganization && cleanSettings && (
        <OrganizationJsonLd settings={cleanSettings} />
      )}
    </>
  );
}
