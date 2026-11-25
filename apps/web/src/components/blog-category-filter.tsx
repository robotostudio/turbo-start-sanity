"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { BLOG_CATEGORIES } from "@/lib/blog-categories";

function categoryHref(category: string, query: string | null) {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }
  if (query) {
    params.set("q", query);
  }
  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}

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
        const href = categoryHref(value, searchQuery);

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
              const query = new URLSearchParams(window.location.search).get(
                "q"
              );
              startTransition(() => {
                setShownCategory(value);
                router.push(categoryHref(value, query));
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
