import { Logger } from "@workspace/logger";

const REVALIDATE_SECONDS = 3600;
const REQUEST_TIMEOUT_MS = 3000;
// Owner and repo may only be word characters, dots and dashes — no slashes, so
// a crafted URL can't escape the /repos/ path (SSRF guard).
const SEGMENT = /^[\w.-]+$/;

const logger = new Logger("GithubStars");

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

export async function getGithubStars(
  gitHubUrl?: string | null
): Promise<number | null> {
  const repo = gitHubUrl ? parseRepo(gitHubUrl) : null;
  if (!repo) {
    return null;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      logger.error(`GitHub API responded ${response.status} for ${repo}`);
      return null;
    }
    const { stargazers_count } = (await response.json()) as {
      stargazers_count?: number;
    };
    return stargazers_count ?? null;
  } catch (error) {
    logger.error("Failed to fetch GitHub star count", error);
    return null;
  }
}
