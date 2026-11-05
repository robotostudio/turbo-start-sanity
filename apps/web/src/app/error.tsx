"use client";

import { Button } from "@workspace/ui/components/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-6 py-24">
      <div className="grid w-full max-w-2xl justify-items-center gap-8 text-center">
        <div className="inline-flex items-center gap-2.5 border border-border px-3 py-1.5 font-light font-mono text-foreground text-sm uppercase tracking-[0.28px]">
          <span className="size-2 shrink-0 rounded-[1px] bg-danger" />
          <span>Error</span>
        </div>

        <h1 className="max-w-2xl text-balance font-normal text-4xl text-foreground tracking-tight sm:text-5xl">
          Something went wrong loading this page.
        </h1>

        <p className="max-w-xl text-pretty text-lg text-muted-foreground">
          Try again, or go back to the home page.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            className="h-9 rounded-full px-4 font-mono font-normal text-sm uppercase tracking-wide"
            onClick={retry}
            size="sm"
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
          <Button
            asChild
            className="h-9 rounded-full px-4 font-mono font-normal text-sm uppercase tracking-wide"
            size="sm"
            variant="outline"
          >
            <a href="/">Return home</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
