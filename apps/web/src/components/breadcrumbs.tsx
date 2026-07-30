import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { Fragment } from "react";

import { CopyMarkdownButton } from "@/components/copy-markdown-button";

export type Crumb = {
  readonly label?: string | null;
  readonly href?: string;
};

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
    <div
      className={cn(
        "border-b-[0.75px] border-zinc-200 dark:border-zinc-900 bg-background",
        className
      )}
    >
      <div className="container flex min-h-13 items-center gap-2.5">
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
  );
}

export function BreadcrumbsSkeleton() {
  return (
    <div className="border-b-[0.75px] border-zinc-200 bg-background dark:border-zinc-900">
      <div className="container flex min-h-13 animate-pulse items-center gap-2.5">
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
