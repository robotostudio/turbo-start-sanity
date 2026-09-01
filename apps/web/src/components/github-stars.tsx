import { GithubIcon } from "@workspace/sanity-blocks/internal/icons";
import { cn } from "@workspace/tailwind-config/utils";

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
    // The visible content is an icon plus a bare count, so the name has to say
    // what the link actually does — and that it leaves the tab.
    <a
      aria-label={`GitHub repository, ${formatStars(stars)} stars (opens in a new tab)`}
      className={cn(
        "focus-ring inline-flex h-8 items-center gap-2 rounded-full px-2 font-mono font-normal text-foreground text-sm uppercase tracking-wide group-data-[nav-on=dark]:text-white group-data-[nav-on=light]:text-zinc-900",
        className
      )}
      href={gitHubUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <GithubIcon className="size-[18px] shrink-0" />
      <span className="tabular-nums">{formatStars(stars)}</span>
    </a>
  );
}
