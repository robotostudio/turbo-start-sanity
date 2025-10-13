import { stegaClean } from "next-sanity";
import type {
  Answer,
  Article,
  ContactPoint,
  FAQPage,
  ImageObject,
  Organization,
  Person,
  Question,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { client, urlFor } from "@/lib/sanity/client";
import { querySettingsData } from "@/lib/sanity/query";
import type {
  QueryBlogSlugPageDataResult,
  QuerySettingsDataResult,
} from "@/lib/sanity/sanity.types";
import { getBaseUrl, handleErrors } from "@/utils";

type RichTextChild = {
  _type: string;
  text?: string;
  marks?: string[];
  _key: string;
};

type RichTextBlock = {
  _type: string;
  children?: RichTextChild[];
  style?: string;
  _key: string;
};

// Flexible FAQ type that can accept different rich text structures
type FlexibleFaq = {
  _id: string;
  title: string;
  richText?: RichTextBlock[] | null;
};

// Utility function to safely extract plain text from rich text blocks
function extractPlainTextFromRichText(
  richText: RichTextBlock[] | null | undefined
): string {
  if (!Array.isArray(richText)) {
    return "";
  }

  return richText
    .filter((block) => block._type === "block" && Array.isArray(block.children))
    .map(
      (block) =>
        block.children
          ?.filter((child) => child._type === "span" && Boolean(child.text))
          .map((child) => child.text)
          .join("") ?? ""
    )
    .join(" ")
    .trim();
}

// Utility function to safely render JSON-LD
export function JsonLdScript<T>({ data, id }: { data: T; id: string }) {
  return (
    <script id={id} type="application/ld+json">
      {JSON.stringify(data, null, 0)}
    </script>
  );
}

// FAQ JSON-LD Component
type FaqJsonLdProps = {
  faqs: FlexibleFaq[];
};

export function FaqJsonLd({ faqs }: FaqJsonLdProps) {
  if (!faqs?.length) {
    return null;
  }

  const validFaqs = stegaClean(
    faqs.filter((faq) => faq?.title && faq?.richText)
  );

  if (!validFaqs.length) {
    return null;
  }

  const faqJsonLd: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map(
      (faq): Question => ({
        "@type": "Question",
        name: faq.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: extractPlainTextFromRichText(faq.richText),
        } as Answer,
      })
    ),
  };

  return <JsonLdScript data={faqJsonLd} id="faq-json-ld" />;
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
  faqs?: FlexibleFaq[];
  includeWebsite?: boolean;
  includeOrganization?: boolean;
};

export async function CombinedJsonLd({
  includeWebsite = false,
  includeOrganization = false,
}: CombinedJsonLdProps) {
  const [res] = await handleErrors(client.fetch(querySettingsData));

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
