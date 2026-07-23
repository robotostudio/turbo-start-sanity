import { GithubIcon } from "@/components/icons";

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
  if (!gitHubUrl) {
    return null;
  }

  const hasStars = stars !== null && stars !== undefined;

  return (
    <a
      aria-label={hasStars ? `GitHub stars: ${stars}` : "GitHub repository"}
      className={
        "focus-ring inline-flex items-center gap-2 rounded-md px-2 py-1 font-mono font-normal text-foreground text-sm uppercase tracking-wide" +
        (className ? ` ${className}` : "")
      }
      href={gitHubUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <GithubIcon className="size-[18px] shrink-0" />
      {hasStars ? (
        <span className="text-foreground tabular-nums">
          {formatStars(stars)}
        </span>
      ) : null}
    </a>
  );
}
