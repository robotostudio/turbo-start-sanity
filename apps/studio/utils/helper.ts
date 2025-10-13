import { isPortableTextTextBlock, type StringOptions } from "sanity";

export const isRelativeUrl = (url: string) =>
  url.startsWith("/") || url.startsWith("#") || url.startsWith("?");

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return isRelativeUrl(url);
  }
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const getTitleCase = (name: string) => {
  const titleTemp = name.replace(/([A-Z])/g, " $1");
  return titleTemp.charAt(0).toUpperCase() + titleTemp.slice(1);
};

export const createRadioListLayout = (
  items: Array<string | { title: string; value: string }>,
  options?: StringOptions
): StringOptions => {
  const list = items.map((item) => {
    if (typeof item === "string") {
      return {
        title: getTitleCase(item),
        value: item,
      };
    }
    return item;
  });
  return {
    layout: "radio",
    list,
    ...options,
  };
};

export const parseRichTextToString = (
  value: unknown,
  maxWords: number | undefined
) => {
  if (!Array.isArray(value)) {
    return "No Content";
  }

  const text = value.map((val) => {
    const test = isPortableTextTextBlock(val);
    if (!test) {
      return "";
    }
    return val.children
      .map((child) => child.text)
      .filter(Boolean)
      .join(" ");
  });
  if (maxWords) {
    return `${text.join(" ").split(" ").slice(0, maxWords).join(" ")}...`;
  }
  return text.join(" ");
};

export function splitArray<T>(array: T[], numChunks: number): T[][] {
  const result: T[][] = Array.from({ length: numChunks }, () => []);
  for (let i = 0; i < array.length; i++) {
    result[i % numChunks].push(array[i]);
  }
  return result;
}

export type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (error: Error, attempt: number) => void;
};

export async function retryPromise<T>(
  promiseFn: Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30_000,
    onRetry,
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      // Attempt the async operation
      return await promiseFn;
    } catch (e) {
      const error = e instanceof Error ? e : new Error("Unknown error");
      lastError = error;
      attempt++;

      if (onRetry) {
        onRetry(error, attempt);
      }

      if (attempt >= maxRetries) {
        throw error;
      }

      const backoff = Math.min(initialDelay * 2 ** (attempt - 1), maxDelay);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw lastError ?? new Error("Promise retry failed");
}

/**
 * Converts a URL pathname to a human-readable title
 */
export function pathnameToTitle(pathname: string): string {
  if (pathname === "/") {
    return "Home";
  }
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  return lastSegment
    .charAt(0)
    .toUpperCase()
    .concat(lastSegment.slice(1).replace(/-/g, " "));
}

export const getTemplateName = (template: string) => `${template}-with-slug`;

export function createPageTemplate() {
  const pages = [
    {
      title: "Page",
      type: "page",
    },
    {
      title: "Blog",
      type: "blog",
    },
  ];
  return pages.map((page) => ({
    schemaType: page.type,
    id: getTemplateName(page.type),
    title: `${page.title} with slug`,
    value: (props: { slug?: string }) => ({
      ...(props.slug ? { slug: { current: props.slug, _type: "slug" } } : {}),
    }),
    parameters: [
      {
        name: "slug",
        type: "string",
      },
    ],
  }));
}

/**
 * Determines the presentation URL based on the current environment.
 * Uses localhost:3000 for development.
 * In production, requires SANITY_STUDIO_PRESENTATION_URL to be set.
 * @throws {Error} If SANITY_STUDIO_PRESENTATION_URL is not set in production
 */
export const getPresentationUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  const presentationUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;
  if (!presentationUrl) {
    throw new Error(
      "SANITY_STUDIO_PRESENTATION_URL must be set in production environment"
    );
  }

  return presentationUrl;
};
