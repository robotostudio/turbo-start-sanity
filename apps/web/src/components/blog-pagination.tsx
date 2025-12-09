import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";
import { useCallback } from "react";

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
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
  } else {
    // Always show first page
    items.push(1);

    // Add ellipsis if needed
    if (currentPage - delta > 2) {
      items.push("ellipsis");
    }

    // Add pages around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    // Add ellipsis if needed
    if (currentPage + delta < totalPages - 1) {
      items.push("ellipsis");
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(totalPages);
    }
  }

  return items;
}

export function BlogPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  basePath = "/blog",
  className,
}: BlogPaginationProps) {
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  const getPageUrl = useCallback(
    (page: number): string => {
      if (page === 1) {
        return basePath;
      }
      return `${basePath}?page=${page}`;
    },
    [basePath]
  );

  return (
    <div className={className}>
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious
                aria-label={`Go to page ${currentPage - 1}`}
                href={getPageUrl(currentPage - 1)}
                size="default"
              />
            </PaginationItem>
          )}

          {paginationItems.map((item, index) => (
            <PaginationItem
              key={item === "ellipsis" ? `ellipsis-${index}` : item}
            >
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  aria-label={`Go to page ${item}`}
                  href={getPageUrl(item)}
                  isActive={item === currentPage}
                  size="icon"
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                aria-label={`Go to page ${currentPage + 1}`}
                href={getPageUrl(currentPage + 1)}
                size="default"
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
