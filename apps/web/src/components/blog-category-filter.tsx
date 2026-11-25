"use client";

import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { BLOG_CATEGORIES } from "@/lib/blog-categories";

export function BlogCategoryFilter({
  activeCategory,
  className,
}: Readonly<{ activeCategory: string; className?: string }>) {
  const router = useRouter();
  const [shownCategory, setShownCategory] = useOptimistic(activeCategory);

  return (
    <nav
      aria-label="Filter posts by category"
      className={cn("grid gap-2", className)}
    >
      {BLOG_CATEGORIES.map(({ label, value }) => {
        const isActive = shownCategory === value;
        const href = value ? `/blog?category=${value}` : "/blog";

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
              const params = new URLSearchParams(window.location.search);
              params.delete("page");
              if (value) {
                params.set("category", value);
              } else {
                params.delete("category");
              }
              const search = params.toString();
              startTransition(() => {
                setShownCategory(value);
                router.push(search ? `/blog?${search}` : "/blog");
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
