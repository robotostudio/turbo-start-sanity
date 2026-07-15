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
}

function generatePaginationItems(currentPage: number, totalPages: number) {
  const items: (number | "ellipsis")[] = [];
  const delta = 2; // Number of pages to show around current page

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
  } else {
    items.push(1);

    if (currentPage - delta > 2) {
      items.push("ellipsis");
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (currentPage + delta < totalPages - 1) {
      items.push("ellipsis");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }
  }

  return items;
}

// Prev/Next labels and page numbers all use the default sans typeface.
const navLabelBase =
  "text-sm font-light leading-5 tracking-wide transition-colors";

export function BlogPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  basePath = "/blog",
  className,
}: BlogPaginationProps) {
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  const getPageUrl = (page: number): string => {
    if (page === 1) {
      return basePath;
    }
    return `${basePath}?page=${page}`;
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
            "focus-ring rounded-none text-zinc-500 hover:text-foreground focus-visible:rounded-sm"
          )}
          href={getPageUrl(currentPage - 1)}
        >
          Previous
        </Link>
      ) : null}

      {paginationItems.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span
              aria-hidden="true"
              className="text-sm font-light text-zinc-500 leading-5"
              key={`ellipsis-${index}`}
            >
              &hellip;
            </span>
          );
        }

        if (item === currentPage) {
          return (
            <span
              aria-current="page"
              className="flex items-center justify-center rounded-none border border-foreground px-2 py-0.5 text-sm text-foreground leading-5 dark:border-accent-green dark:text-accent-green"
              key={item}
            >
              {item}
            </span>
          );
        }

        return (
          <Link
            aria-label={`Go to page ${item}`}
            className="focus-ring rounded-none px-0.5 text-sm font-light text-zinc-500 leading-5 transition-colors hover:text-foreground focus-visible:rounded-sm"
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
            "focus-ring rounded-none text-zinc-500 hover:text-foreground focus-visible:rounded-sm"
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
