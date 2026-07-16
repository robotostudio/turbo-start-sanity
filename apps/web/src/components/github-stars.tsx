"use client";

import useSWR from "swr";

import { GithubIcon } from "@/components/icons";

type GithubStarsResponse = {
  repo: string | null;
  stars: number | null;
};

const fetcher = async (url: string): Promise<GithubStarsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch GitHub stars");
  }
  return response.json();
};

function formatStars(stars: number): string {
  if (stars < 1000) {
    return String(stars);
  }
  const thousands = stars / 1000;
  return `${thousands.toFixed(thousands < 10 ? 1 : 0)}k`;
}

// Parse an "owner/repo" slug from a github.com URL, dropping any trailing
// ".git" or slash. Returns null when the URL isn't a usable repo link.
function parseRepo(gitHubUrl: string): string | null {
  try {
    const { hostname, pathname } = new URL(gitHubUrl);
    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return null;
    }
    const segments = pathname.split("/").filter(Boolean);
    const owner = segments[0];
    const repo = segments[1];
    if (!(owner && repo)) {
      return null;
    }
    const normalizedRepo = repo.replace(/\.git$/, "");
    if (!normalizedRepo) {
      return null;
    }
    return `${owner}/${normalizedRepo}`;
  } catch {
    return null;
  }
}

export function GithubStars({
  className,
  gitHubUrl,
}: Readonly<{
  className?: string;
  gitHubUrl?: string | null;
}>) {
  const repo = gitHubUrl ? parseRepo(gitHubUrl) : null;

  const { data } = useSWR<GithubStarsResponse>(
    repo ? `/api/github-stars?repo=${encodeURIComponent(repo)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Only render the badge when a repository URL is configured in Studio.
  if (!(gitHubUrl && repo)) {
    return null;
  }

  const stars = data?.stars ?? null;
  const href = gitHubUrl;

  return (
    <a
      aria-label={
        stars === null ? "GitHub repository" : `GitHub stars: ${stars}`
      }
      className={
        "focus-ring inline-flex items-center gap-2 rounded-md px-2 py-1 font-mono font-normal text-foreground text-sm uppercase tracking-wide" +
        (className ? ` ${className}` : "")
      }
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <GithubIcon className="size-[18px] shrink-0" />
      {stars !== null ? (
        <span className="text-muted-foreground">{formatStars(stars)}</span>
      ) : null}
    </a>
  );
}
