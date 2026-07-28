export function HeroFallback() {
  return (
    <main className="-mt-16 animate-pulse">
      <div className="h-[calc(100svh-var(--hero-copy))] overflow-hidden bg-muted" />
      <div className="relative z-10 bg-background pt-10 pb-8 md:pt-12 md:pb-12">
        <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="grid gap-5">
            <div className="grid max-w-[827px] text-4xl sm:text-5xl lg:text-[64px]">
              <div className="h-[1.1em] w-full bg-muted bg-clip-content py-[0.12em]" />
              <div className="h-[1.1em] w-2/3 bg-muted bg-clip-content py-[0.12em]" />
              <div className="h-[1.1em] w-1/3 bg-muted bg-clip-content py-[0.12em] sm:hidden" />
            </div>
            <div className="body-text grid max-w-[633px]">
              <div className="h-[1lh] w-full bg-muted bg-clip-content py-[0.2lh]" />
              <div className="h-[1lh] w-4/5 bg-muted bg-clip-content py-[0.2lh]" />
              <div className="h-[1lh] w-3/5 bg-muted bg-clip-content py-[0.2lh] lg:hidden" />
              <div className="h-[1lh] w-2/5 bg-muted bg-clip-content py-[0.2lh] sm:hidden" />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <div className="h-12 w-full rounded-full bg-muted sm:w-44" />
            <div className="h-12 w-full rounded-full bg-muted sm:w-44" />
          </div>
        </div>
      </div>
    </main>
  );
}
