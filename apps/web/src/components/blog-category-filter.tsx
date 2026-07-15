"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BLOG_CATEGORIES } from "@/lib/blog-categories";

export function BlogCategoryFilter({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  return (
    <nav
      aria-label="Filter posts by category"
      className={cn("grid gap-2", className)}
    >
      {BLOG_CATEGORIES.map(({ label, value }) => {
        const isActive = activeCategory === value;
        const href = value ? `/blog?category=${value}` : "/blog";

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex w-max items-center rounded-none px-1 py-px font-mono text-sm uppercase tracking-wide transition-colors focus-visible:rounded-md",
              isActive
                ? "bg-accent-green text-accent-green-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            href={href}
            key={value || "all"}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
