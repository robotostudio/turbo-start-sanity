import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { Fragment } from "react";

import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { JsonLdScript } from "@/components/json-ld";
import { getBaseUrl } from "@/utils";

export type Crumb = {
  readonly label?: string | null;
  readonly href?: string;
};

/** Turns a slug segment into a human label: `pd-blowers` -> `Pd Blowers`. */
export function humanizeSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Ancestor crumbs for a nested slug, excluding the page itself. */
export function ancestorCrumbs(segments: readonly string[]): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  let path = "";
  for (const segment of segments.slice(0, -1)) {
    path += `/${segment}`;
    crumbs.push({ label: humanizeSegment(segment), href: path });
  }
  return crumbs;
}

/**
 * `BreadcrumbList` for the trail. Rendered separately from the visible bar
 * because pages that open with a hero hide the bar by design but still need the
 * structured data — otherwise Google shows the bare URL in place of a trail.
 */
export function BreadcrumbsJsonLd({
  crumbs,
}: Readonly<{ crumbs: readonly Crumb[] }>) {
  const trail = crumbs.filter((crumb) => Boolean(crumb.label));

  if (trail.length < 2) {
    return null;
  }

  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.label,
          ...(crumb.href ? { item: `${baseUrl}${crumb.href}` } : {}),
        })),
      }}
      id="breadcrumb-json-ld"
    />
  );
}

const CRUMB_LINK_CLASS =
  "focus-ring inline-flex min-h-10 items-center hover:text-foreground motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out";

export function Breadcrumbs({
  crumbs,
  className,
}: Readonly<{ crumbs: readonly Crumb[]; className?: string }>) {
  const trail = crumbs.filter((crumb) => Boolean(crumb.label));

  if (trail.length === 0) {
    return null;
  }

  return (
    <>
      <BreadcrumbsJsonLd crumbs={trail} />
      <div
        className={cn(
          "border-b-[0.75px] border-zinc-200 dark:border-zinc-900 bg-background",
          className
        )}
      >
        <div className="container flex min-h-13 items-center gap-2.5 pt-6 pb-2">
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1.5 font-light uppercase font-mono text-muted-foreground text-sm leading-5 tracking-[0.24px]">
              {trail.map((crumb, index) => {
                const isCurrent = index === trail.length - 1;
                return (
                  <Fragment key={crumb.href ?? crumb.label}>
                    {index > 0 ? (
                      <li aria-hidden="true" className="shrink-0 select-none">
                        /
                      </li>
                    ) : null}
                    <li
                      aria-current={isCurrent ? "page" : undefined}
                      className={isCurrent ? "min-w-0 truncate" : "shrink-0"}
                    >
                      {isCurrent || !crumb.href ? (
                        crumb.label
                      ) : (
                        <Link className={CRUMB_LINK_CLASS} href={crumb.href}>
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </nav>

          <CopyMarkdownButton />
        </div>
      </div>
    </>
  );
}

export function BreadcrumbsSkeleton() {
  return (
    <div className="border-b-[0.75px] border-zinc-200 bg-background dark:border-zinc-900">
      <div className="container flex min-h-13 animate-pulse items-center gap-2.5 pt-6 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="h-5 w-14 shrink-0 bg-muted/50" />
          <div className="h-5 w-1.5 shrink-0 bg-muted/50" />
          <div className="h-5 w-40 min-w-0 bg-muted/50" />
        </div>
        <div className="h-5 w-40 shrink-0 bg-muted/50" />
      </div>
    </div>
  );
}
