import { fetchHtml } from "./fetcher";
import { extractMetadata, generateFallbackMetadata } from "./parser";
import type { MetadataResult } from "./types";

function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getMetadata(rawUrl: string): Promise<MetadataResult> {
  const url = normalizeUrl(rawUrl);

  if (!isValidUrl(url)) {
    return {
      success: false,
      error: "Invalid URL",
      data: generateFallbackMetadata(rawUrl),
    };
  }

  const fetchResult = await fetchHtml(url);

  if (!fetchResult.success) {
    return {
      success: false,
      error: fetchResult.error,
      data: generateFallbackMetadata(url),
    };
  }

  const metadata = extractMetadata(fetchResult.html, url);

  return {
    success: true,
    data: metadata,
  };
}
