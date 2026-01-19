const DEFAULT_TIMEOUT = 10000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "max-age=0",
} as const;

export type FetchResult =
  | { success: true; html: string }
  | { success: false; error: string };

async function fetchWithTimeout(
  url: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });
  return response;
}

function isCloudflareProtected(response: Response, html: string): boolean {
  const isCloudflareServer = response.headers.get("server") === "cloudflare";
  const hasChallengePage =
    html.includes("challenge-platform") ||
    html.includes("cf-browser-verification") ||
    html.includes("cf-turnstile");

  return isCloudflareServer && hasChallengePage;
}

export async function fetchHtml(url: string): Promise<FetchResult> {
  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        success: false,
        error: `Invalid content type: ${contentType}`,
      };
    }

    const html = await response.text();

    if (isCloudflareProtected(response, html)) {
      return {
        success: false,
        error: "Site is protected by Cloudflare",
      };
    }

    return { success: true, html };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Request timed out" };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}
