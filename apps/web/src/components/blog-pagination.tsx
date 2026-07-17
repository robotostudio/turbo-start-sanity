import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  basePath?: string;
};

interface BlogPaginationProps extends PaginationProps {
  className?: string;
  category?: string;
}

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function generatePaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  const items: PaginationItem[] = [];
  const delta = 2; // Number of pages to show around current page

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
  } else {
    items.push(1);

    if (currentPage - delta > 2) {
      items.push("ellipsis-start");
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (currentPage + delta < totalPages - 1) {
      items.push("ellipsis-end");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }
  }

  return items;
}

const navLabelBase = "font-light text-base leading-5 transition-colors";

export function BlogPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  basePath = "/blog",
  className,
  category,
}: BlogPaginationProps) {
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  const getPageUrl = (page: number): string => {
    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    if (page > 1) {
      params.set("page", String(page));
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label="Blog pagination"
      className={cn("flex items-center justify-start gap-5", className)}
    >
      {hasPreviousPage ? (
        <Link
          aria-label={`Go to page ${currentPage - 1}`}
          className={cn(
            navLabelBase,
            "focus-ring rounded-none text-zinc-400 hover:text-foreground"
          )}
          href={getPageUrl(currentPage - 1)}
        >
          Previous
        </Link>
      ) : null}

      {paginationItems.map((item) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span
              aria-hidden="true"
              className="font-light font-mono text-base text-zinc-400 leading-5"
              key={item}
            >
              &hellip;
            </span>
          );
        }

        if (item === currentPage) {
          return (
            <span
              aria-current="page"
              className="flex items-center justify-center rounded-none border border-foreground px-2 pt-0.5 pb-1 font-mono text-base text-foreground leading-5 dark:border-accent-green dark:text-accent-green"
              key={item}
            >
              {item}
            </span>
          );
        }

        return (
          <Link
            aria-label={`Go to page ${item}`}
            className="focus-ring rounded-none px-0.5 font-light font-mono text-base text-zinc-400 leading-5 transition-colors hover:text-foreground"
            href={getPageUrl(item)}
            key={item}
          >
            {item}
          </Link>
        );
      })}

      {hasNextPage ? (
        <Link
          aria-label={`Go to page ${currentPage + 1}`}
          className={cn(
            navLabelBase,
            "focus-ring rounded-none text-zinc-400 hover:text-foreground"
          )}
          href={getPageUrl(currentPage + 1)}
        >
          Next
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            navLabelBase,
            "pointer-events-none select-none text-muted-foreground/40"
          )}
        >
          Next
        </span>
      )}
    </nav>
  );
}
