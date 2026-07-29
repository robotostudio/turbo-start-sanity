import { GithubIcon } from "@workspace/sanity-blocks/internal/icons";

function formatStars(stars: number): string {
  if (stars < 1000) {
    return String(stars);
  }
  const thousands = stars / 1000;
  return `${thousands.toFixed(thousands < 10 ? 1 : 0)}k`;
}

export function GithubStars({
  className,
  gitHubUrl,
  stars,
}: Readonly<{
  className?: string;
  gitHubUrl?: string | null;
  stars?: number | null;
}>) {
  if (!gitHubUrl || stars === null || stars === undefined) {
    return null;
  }

  return (
    <a
      aria-label={`GitHub stars: ${stars}`}
      className={
        "focus-ring inline-flex h-8 items-center gap-2 rounded-full px-2 font-mono font-normal text-foreground text-sm uppercase tracking-wide" +
        (className ? ` ${className}` : "")
      }
      href={gitHubUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <GithubIcon className="size-[18px] shrink-0" />
      <span className="text-foreground tabular-nums">{formatStars(stars)}</span>
    </a>
  );
}
