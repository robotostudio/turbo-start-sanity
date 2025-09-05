import { Card, Stack } from "@sanity/ui";
import React, { useCallback } from "react";
import { useRouter } from "sanity/router";

// Custom hooks
import { usePagesTree } from "../hooks/use-pages-tree";
import { useTreeExpansion } from "../hooks/use-tree-expansion";
import { EnhancedLoadingState } from "./skeleton-loader";
// Components
import { TreeHeader } from "./tree-header";
import { TreeList } from "./tree-list";
import { EmptyState, ErrorState } from "./tree-states";

/**
 * HierarchicalPagesTree - A component that displays pages in a hierarchical tree structure
 * based on their slug paths. Supports expansion/collapse, navigation, and real-time updates.
 */
export const HierarchicalPagesTree: React.FC = () => {
  const router = useRouter();

  const { pages, tree, loading, error, refetch } = usePagesTree();

  const { isExpanded, toggleExpansion } = useTreeExpansion(["/"]);

  const handlePageSelect = useCallback(
    (pageId: string) => {
      try {
        router.navigateIntent("edit", { id: pageId, type: "page" });
        // nav.navigateIntent("edit", { id: pageId, type: "page" });
      } catch (err) {
        console.error("Navigation failed:", err);
        // Fallback navigation
        const currentUrl = window.location.pathname;
        const baseUrl = currentUrl.includes("/studio") ? "/studio" : "";
        window.location.href = `${baseUrl}/structure/page;${pageId}`;
      }
    },
    [router],
  );

  if (loading && pages.length === 0) {
    return (
      <EnhancedLoadingState
        message="Building page tree..."
        // progressive={true}
      />
    );
  }

  if (error && pages.length === 0) {
    return (
      <ErrorState error={error} onRetry={refetch} retryLabel="Reload Pages" />
    );
  }

  if (!loading && pages.length === 0) {
    return (
      <EmptyState
        title="No pages yet"
        description="Create your first page in Sanity Studio to see it appear in this hierarchical tree view."
      />
    );
  }

  return (
    <Card padding={3} role="tree" aria-label="Page hierarchy">
      <Stack space={3}>
        <TreeHeader
          totalPages={pages.length}
          loading={loading}
          onRefresh={refetch}
        />

        <TreeList
          tree={tree}
          onPageSelect={handlePageSelect}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpansion}
        />
      </Stack>
    </Card>
  );
};
