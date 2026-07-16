import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

const ACTION_CLASS = "font-mono font-normal text-sm uppercase tracking-wide";

export default function NotFound() {
  return (
    <main className="container flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center py-24">
      <div className="grid max-w-xl justify-items-center gap-8 text-center">
        <div className="inline-flex items-center gap-2 border border-border px-3 py-1.5">
          <span className="size-2 rounded-[1px] bg-accent-green" />
          <span className="font-light font-mono text-foreground text-sm uppercase tracking-wide">
            Error 404
          </span>
        </div>

        <div className="inline-flex items-center justify-center bg-grid-dots-dense px-12 py-8 text-muted-foreground/40 sm:px-20 sm:py-10">
          <h1 className="font-normal text-7xl text-foreground leading-none tracking-tight sm:text-8xl md:text-9xl">
            404
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-balance font-normal text-2xl tracking-tight sm:text-3xl">
            This page could not be found
          </h2>
          <p className="text-balance text-base text-muted-foreground leading-6">
            The page you are looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild className={ACTION_CLASS} size="sm">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild className={ACTION_CLASS} size="sm" variant="outline">
            <Link href="/blog">Browse the blog</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
