"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { BLOG_CATEGORIES } from "@/lib/blog-categories";

export function BlogCategoryFilter({
  activeCategory,
  className,
  searchQuery,
}: Readonly<{
  activeCategory: string;
  className?: string;
  searchQuery: string;
}>) {
  const router = useRouter();
  const [shownCategory, setShownCategory] = useOptimistic(activeCategory);

  return (
    <nav
      aria-label="Filter posts by category"
      className={cn("grid gap-2", className)}
    >
      {BLOG_CATEGORIES.map(({ label, value }) => {
        const isActive = shownCategory === value;
        const params = new URLSearchParams();
        if (value) {
          params.set("category", value);
        }
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        const search = params.toString();
        const href = search ? `/blog?${search}` : "/blog";

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex w-max items-center rounded-none px-1 py-px font-mono text-sm uppercase tracking-wide transition-colors",
              isActive
                ? "bg-accent-green text-accent-green-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            href={href}
            key={value || "all"}
            onNavigate={(event) => {
              event.preventDefault();
              const current = new URLSearchParams(window.location.search);
              current.delete("page");
              if (value) {
                current.set("category", value);
              } else {
                current.delete("category");
              }
              const currentSearch = current.toString();
              startTransition(() => {
                setShownCategory(value);
                router.push(currentSearch ? `/blog?${currentSearch}` : "/blog");
              });
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
