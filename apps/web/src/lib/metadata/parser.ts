import he from "he";
import { parse } from "node-html-parser";

import type { LinkTag, MetaTag, ParsedHead, SiteMetadata } from "./types";

export function parseHead(html: string): ParsedHead {
  const root = parse(html);

  const metaTags: MetaTag[] = root.querySelectorAll("meta").map((el) => ({
    property:
      el.getAttribute("property") ?? el.getAttribute("name") ?? undefined,
    content: el.getAttribute("content") ?? undefined,
  }));

  const title = root.querySelector("title")?.textContent?.trim();

  const linkTags: LinkTag[] = root.querySelectorAll("link").map((el) => ({
    rel: el.getAttribute("rel") ?? undefined,
    href: el.getAttribute("href") ?? undefined,
  }));

  return { metaTags, title, linkTags };
}

function decodeContent(content: string | undefined): string | undefined {
  if (!content) return undefined;
  try {
    return he.decode(content);
  } catch {
    return content;
  }
}

function resolveUrl(baseUrl: string, path: string | undefined): string | null {
  if (!path) return null;

  try {
    // Already absolute URL
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    // Protocol-relative URL
    if (path.startsWith("//")) {
      return `https:${path}`;
    }

    // Relative URL - resolve against base
    const base = new URL(baseUrl);
    return new URL(path, base).toString();
  } catch {
    return null;
  }
}

type MetaMap = Record<string, string>;

function buildMetaMap(parsed: ParsedHead): MetaMap {
  const map: MetaMap = {};

  // Process meta tags (first occurrence wins, normalized to lowercase keys)
  for (const { property, content } of parsed.metaTags) {
    if (property && content) {
      const key = property.toLowerCase();
      if (!map[key]) {
        map[key] = decodeContent(content) || content;
      }
    }
  }

  // Process link tags (split multi-token rel values like "shortcut icon", normalized to lowercase)
  for (const { rel, href } of parsed.linkTags) {
    if (!rel || !href) continue;
    const normalizedRel = rel.toLowerCase();
    // Store the full rel string first (e.g., "shortcut icon")
    if (!map[normalizedRel]) {
      map[normalizedRel] = href;
    }
    // Also store individual tokens (e.g., "shortcut" and "icon")
    const tokens = normalizedRel.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (!map[token]) {
        map[token] = href;
      }
    }
  }

  return map;
}

function getSafeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return typeof url === "string" ? url : "";
  }
}

export function extractMetadata(html: string, url: string): SiteMetadata {
  const parsed = parseHead(html);
  const meta = buildMetaMap(parsed);

  // Title: og:title > twitter:title > <title>
  const title =
    meta["og:title"] ||
    meta["twitter:title"] ||
    parsed.title ||
    getSafeHostname(url);

  // Description: og:description > twitter:description > description
  const description =
    meta["og:description"] ||
    meta["twitter:description"] ||
    meta["description"] ||
    "";

  // Image: og:image > twitter:image > image_src
  const rawImage =
    meta["og:image"] || meta["twitter:image"] || meta["image_src"] || null;

  // Favicon: icon > shortcut icon > apple-touch-icon
  const rawFavicon =
    meta["icon"] || meta["shortcut icon"] || meta["apple-touch-icon"] || null;

  // Site name
  const siteName = meta["og:site_name"] || null;

  return {
    title: title.trim(),
    description: description.trim(),
    image: rawImage ? resolveUrl(url, rawImage) : null,
    favicon: rawFavicon ? resolveUrl(url, rawFavicon) : null,
    siteName,
    url,
  };
}

export function generateFallbackMetadata(url: string): SiteMetadata {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    // Try to make a readable title from the pathname
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || "";
    const formattedTitle = lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\.[^.]+$/, "") // Remove file extension
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      title: formattedTitle || hostname,
      description: "",
      image: null,
      favicon: `https://${parsed.hostname}/favicon.ico`,
      siteName: hostname,
      url,
    };
  } catch {
    return {
      title: url,
      description: "",
      image: null,
      favicon: null,
      siteName: null,
      url,
    };
  }
}
