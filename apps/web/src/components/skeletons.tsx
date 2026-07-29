import { cn } from "@workspace/tailwind-config/utils";

import { BreadcrumbsSkeleton } from "@/components/breadcrumbs";

export function Skeleton({ className }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={cn("bg-muted", className)} />;
}

export function BlogCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 border border-border p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Skeleton className="h-[26px] w-full" />
          <Skeleton className="h-[26px] w-2/3" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function BlogGridSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <BlogCardSkeleton key={`blog-card-skeleton-${index.toString()}`} />
      ))}
    </div>
  );
}

export function HeroFallback() {
  return (
    <main className="-mt-16 animate-pulse">
      <Skeleton className="h-[calc(100svh-var(--hero-copy))] overflow-hidden" />
      <div className="relative z-10 bg-background pt-10 pb-8 md:pt-12 md:pb-12">
        <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="grid gap-5">
            <div className="grid max-w-[827px] text-4xl sm:text-5xl lg:text-[64px]">
              <Skeleton className="h-[1.1em] w-full bg-clip-content py-[0.12em]" />
              <Skeleton className="h-[1.1em] w-2/3 bg-clip-content py-[0.12em]" />
              <Skeleton className="h-[1.1em] w-1/3 bg-clip-content py-[0.12em] sm:hidden" />
            </div>
            <div className="body-text grid max-w-[633px]">
              <Skeleton className="h-[1lh] w-full bg-clip-content py-[0.2lh]" />
              <Skeleton className="h-[1lh] w-4/5 bg-clip-content py-[0.2lh]" />
              <Skeleton className="h-[1lh] w-3/5 bg-clip-content py-[0.2lh] lg:hidden" />
              <Skeleton className="h-[1lh] w-2/5 bg-clip-content py-[0.2lh] sm:hidden" />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Skeleton className="h-12 w-full rounded-full sm:w-44" />
            <Skeleton className="h-12 w-full rounded-full sm:w-44" />
          </div>
        </div>
      </div>
    </main>
  );
}

function TextBlockSkeleton({
  lines,
  lastWidth = "w-3/5",
}: Readonly<{ lines: number; lastWidth?: string }>) {
  const rows = Array.from({ length: lines }, (_, index) => ({
    id: `skeleton-line-${index}`,
    width: index === lines - 1 ? lastWidth : "w-full",
  }));
  return (
    <div className="grid gap-2.5">
      {rows.map((row) => (
        <Skeleton className={`h-5 ${row.width}`} key={row.id} />
      ))}
    </div>
  );
}

function QuoteSkeleton() {
  return (
    <div className="bg-grid-dots p-4">
      <div className="grid gap-2.5 bg-background p-8">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}

function ShareItemSkeleton() {
  return (
    <div>
      <Skeleton className="size-4.5" />
      <Skeleton className="h-4 w-10" />
    </div>
  );
}

export function BlogFallback() {
  return (
    <main className="bg-background">
      <BreadcrumbsSkeleton />
      <div className="container flex animate-pulse flex-col gap-16 pt-12 pb-24 md:gap-24 md:pt-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-4/5 sm:h-12 lg:h-16" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-64" />
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-32">
          <div className="grid min-w-0 gap-8">
            <TextBlockSkeleton lastWidth="w-4/5" lines={3} />
            <Skeleton className="h-7 w-2/5" />
            <TextBlockSkeleton lastWidth="w-1/2" lines={4} />
            <QuoteSkeleton />
            <TextBlockSkeleton lastWidth="w-3/5" lines={3} />
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-grid-dots p-6">
                <div className="flex flex-col gap-12 bg-background p-4">
                  <div>
                    <Skeleton className="h-7 w-32" />
                    <div className="mt-6 flex flex-col gap-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-zinc-900 border-t px-1 pt-4 dark:border-zinc-50 [&>div]:grid [&>div]:justify-items-center [&>div]:gap-1">
                    <ShareItemSkeleton />
                    <ShareItemSkeleton />
                    <ShareItemSkeleton />
                    <ShareItemSkeleton />
                    <ShareItemSkeleton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
