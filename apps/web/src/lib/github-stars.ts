import { cacheLife, cacheTag } from "next/cache";

const REVALIDATE_SECONDS = 3600;
const EXPIRE_SECONDS = 86_400;
const REQUEST_TIMEOUT_MS = 3000;
// Owner/repo: word chars, dots, dashes only — no slashes can escape /repos/ (SSRF guard).
const SEGMENT = /^[\w.-]+$/;

function parseRepo(gitHubUrl: string): string | null {
  try {
    const { hostname, pathname } = new URL(gitHubUrl);
    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }
    const [owner, name] = pathname.split("/").filter(Boolean);
    const repo = name?.replace(/\.git$/, "");
    if (!(owner && repo && SEGMENT.test(owner) && SEGMENT.test(repo))) {
      return null;
    }
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

// Own cache scope (separate from the navbar) on an hourly cadence, bustable via
// the "github-stars" tag. Throws on failure so only a successful count is ever
// cached — the next request retries instead of pinning a stale `null`.
async function fetchGithubStars(repo: string): Promise<number> {
  "use cache";
  cacheLife({ revalidate: REVALIDATE_SECONDS, expire: EXPIRE_SECONDS });
  cacheTag("github-stars");

  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GitHub stars request failed with ${response.status}`);
  }
  const { stargazers_count } = (await response.json()) as {
    stargazers_count?: number;
  };
  if (typeof stargazers_count !== "number") {
    throw new Error("GitHub stars response missing stargazers_count");
  }
  return stargazers_count;
}

export async function getGithubStars(
  gitHubUrl?: string | null
): Promise<number | null> {
  const repo = gitHubUrl ? parseRepo(gitHubUrl) : null;
  if (!repo) {
    return null;
  }

  try {
    return await fetchGithubStars(repo);
  } catch {
    return null;
  }
}
