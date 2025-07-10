import {
  isPortableTextTextBlock,
  type SanityDocument,
  type StringOptions,
} from "sanity";

import type { Page, Tree, TreeNode } from "./types";

export const isRelativeUrl = (url: string) =>
  url.startsWith("/") || url.startsWith("#") || url.startsWith("?");

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.error(e);
    return isRelativeUrl(url);
  }
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getTitleCase = (name: string) => {
  const titleTemp = name.replace(/([A-Z])/g, " $1");
  return titleTemp.charAt(0).toUpperCase() + titleTemp.slice(1);
};

export const createRadioListLayout = (
  items: Array<string | { title: string; value: string }>,
  options?: StringOptions,
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
  maxWords: number | undefined = undefined,
) => {
  if (!Array.isArray(value)) return "No Content";

  const text = value.map((val) => {
    const test = isPortableTextTextBlock(val);
    if (!test) return "";
    return val.children
      .map((child) => child.text)
      .filter(Boolean)
      .join(" ");
  });
  if (maxWords)
    return `${text.join(" ").split(" ").slice(0, maxWords).join(" ")}...`;
  return text.join(" ");
};

export function splitArray<T>(array: T[], numChunks: number): T[][] {
  const result: T[][] = Array.from({ length: numChunks }, () => []);
  for (let i = 0; i < array.length; i++) {
    result[i % numChunks].push(array[i]);
  }
  return result;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (error: Error, attempt: number) => void;
}
export async function retryPromise<T>(
  promiseFn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
  } = options;

  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      return await promiseFn();
    } catch (error) {
      const isLastAttempt = attempts === maxRetries - 1;
      if (isLastAttempt) {
        throw error instanceof Error
          ? error
          : new Error("Promise retry failed");
      }

      const normalizedError =
        error instanceof Error ? error : new Error("Unknown error");

      if (onRetry) {
        onRetry(normalizedError, attempts + 1);
      }

      const backoffDelay = Math.min(initialDelay * 2 ** attempts, maxDelay);

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw new Error("Promise retry failed");
}

/**
 * Converts a URL pathname to a human-readable title
 */
export function pathnameToTitle(pathname: string): string {
  if (pathname === "/") return "Home";
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
  return lastSegment
    .charAt(0)
    .toUpperCase()
    .concat(lastSegment.slice(1).replace(/-/g, " "));
}

/**
 * Builds a tree structure from a list of pages
 */
export function buildTree(pages: Page[]): Tree {
  const root: Tree = {};

  function createNode(
    item: Page,
    pathSoFar: string,
    isFolder: boolean,
  ): TreeNode {
    return {
      ...item,
      slug: pathSoFar,
      edited: item._originalId?.startsWith("drafts."),
      _id: isFolder ? pathSoFar + pathSoFar.split("/").length : item._id,
      _type: isFolder ? ("folder" as const) : item._type,
      title: pathnameToTitle(pathSoFar),
      children: {},
    };
  }

  function processSegments(
    item: Page,
    segments: string[],
    currentFolder: Tree,
  ): void {
    let pathSoFar = "";

    segments.forEach((segment, index) => {
      pathSoFar += `/${segment}`;
      const isFolder = index !== segments.length - 1;
      const node = createNode(item, pathSoFar, isFolder);

      if (!currentFolder[segment]) {
        currentFolder[segment] = node;
      } else if (!isFolder && currentFolder[segment]._type === "folder") {
        currentFolder[segment].children[""] = node;
      } else if (isFolder && currentFolder[segment]._type !== "folder") {
        currentFolder[segment] = {
          ...node,
          children: { "": currentFolder[segment] },
        };
      }
      // biome-ignore lint/style/noParameterAssign: needed for tree traversal
      currentFolder = currentFolder[segment].children as Tree;
    });
  }

  for (const page of pages) {
    const segments =
      page.slug === "/" ? [""] : page.slug?.split("/").filter(Boolean) || [];
    processSegments(page, segments, root);
  }

  return root;
}

/**
 * Finds the closest tree containing a folder at the given path
 */
export function findTreeByPath(root: Tree, path?: string): Tree {
  if (!path || path === "/") return root;

  let currentTree = root;
  const segments = path.split("/").filter(Boolean);

  for (const segment of segments) {
    const node = currentTree[segment];
    if (!node || node._type !== "folder") break;
    currentTree = node.children;
  }

  return currentTree;
}
/**
 * Formats a path string by:
 * 1. Removing any double slashes (e.g. // -> /)
 * 2. Ensuring path starts with a single leading slash
 * 3. Removing trailing slashes
 * 4. Handling undefined/invalid inputs
 */
export function formatPath(path: string | undefined | null): string {
  if (typeof path !== "string") return "/";

  return (
    path
      .trim()
      // Remove any double slashes
      .replace(/\/{2,}/g, "/")
      // Remove leading and trailing slashes
      .replace(/^\/+|\/+$/g, "")
      // Add single leading slash
      .replace(/^/, "/")
  );
}

/**
 * Gets variations of a path with different slash combinations
 * Useful for path matching and comparisons
 */
export function getPathVariations(path: string | undefined): string[] {
  if (typeof path !== "string") return [];

  const normalizedPath = formatPath(path).slice(1); // Remove leading slash

  return [
    normalizedPath,
    `/${normalizedPath}/`,
    `${normalizedPath}/`,
    `/${normalizedPath}`,
  ];
}

export const getTemplateName = (template: string) => {
  return `${template}-with-slug`;
};

export const getDocumentPath = (document: SanityDocument) => {
  if (typeof document.slug !== "string") return;
  return formatPath(document.slug);
};

interface PathnameOptions {
  allowTrailingSlash?: boolean;
}

/**
 * Converts a string into a valid pathname by:
 * 1. Converting to lowercase
 * 2. Replacing spaces with hyphens
 * 3. Removing invalid characters (only a-z, 0-9, hyphens and slashes allowed)
 * 4. Normalizing multiple hyphens and slashes
 * 5. Ensuring leading slash
 * 6. Optionally allowing trailing slash
 */
export function stringToPathname(input: string, options?: PathnameOptions) {
  if (typeof input !== "string") {
    return "/";
  }

  const sanitized = input
    .toLowerCase()
    // Convert spaces to hyphens
    .replace(/\s+/g, "-")
    // Normalize slashes except at start
    .replace(/(?!^)\/+/g, "/")
    // Remove invalid characters
    .replace(/[^a-z0-9-/]+/g, "")
    // Normalize multiple hyphens
    .replace(/-+/g, "-")
    // Normalize multiple slashes
    .replace(/\/+/g, "/");

  const withoutTrailingSlash = options?.allowTrailingSlash
    ? sanitized
    : sanitized.replace(/\/$/, "");

  // Ensure leading slash and normalize any remaining multiple slashes
  return `/${withoutTrailingSlash}`.replace(/\/+/g, "/");
}

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
  return pages.map((page) => {
    return {
      schemaType: page.type,
      id: getTemplateName(page.type),
      title: `${page.title} with slug`,
      value: (props: { slug?: string }) => {
        return {
          ...(props.slug
            ? { slug: { current: props.slug, _type: "slug" } }
            : {}),
        };
      },
      parameters: [
        {
          name: "slug",
          type: "string",
        },
      ],
    };
  });
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
      "SANITY_STUDIO_PRESENTATION_URL must be set in production environment",
    );
  }

  return presentationUrl;
};
