"use client";

import useSWR from "swr";

// Official GitHub mark (octocat) — the recognizable brand logo, rather than
// lucide's simplified glyph.
function GithubIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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
