import { Logger } from "@workspace/logger";
import { NextResponse } from "next/server";

// Cache the star count for 1 hour to avoid hitting GitHub API rate limits.
const REVALIDATE_SECONDS = 3600;

// Only allow "owner/repo" slugs so we never fetch an arbitrary URL (SSRF guard).
const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

const logger = new Logger("GithubStarsRoute");

export async function GET(request: Request) {
  const repo = new URL(request.url).searchParams.get("repo");

  if (!repo || !REPO_PATTERN.test(repo)) {
    return NextResponse.json({ repo: null, stars: null });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      logger.error(
        `GitHub API responded with status ${response.status} for ${repo}`
      );
      return NextResponse.json({ repo, stars: null });
    }

    const data = (await response.json()) as { stargazers_count?: number };
    const stars =
      typeof data.stargazers_count === "number" ? data.stargazers_count : null;

    return NextResponse.json({ repo, stars });
  } catch (error) {
    logger.error("Failed to fetch GitHub star count", error);
    return NextResponse.json({ repo, stars: null });
  }
}
