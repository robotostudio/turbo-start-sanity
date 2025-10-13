import { Card, Stack, useToast } from "@sanity/ui";
import type React from "react";
import { useCallback } from "react";
import { useRouter } from "sanity/router";
import { usePaneRouter } from "sanity/structure";

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
  const paneRouter = usePaneRouter();
  const toast = useToast();

  const { pages, tree, loading, error, refetch } = usePagesTree();

  const { isExpanded, toggleExpansion } = useTreeExpansion(["/"]);

  const handlePageSelect = useCallback(
    (pageId: string) => {
      try {
        paneRouter.replaceCurrent({
          id: pageId,
          params: { type: "page" },
        });
      } catch (_err) {
        // Fallback to router navigation
        try {
          router.navigateIntent("edit", { id: pageId, type: "page" });
        } catch (_fallbackErr) {
          // Last resort fallback navigation
          const currentUrl = window.location.pathname;
          const baseUrl = currentUrl.includes("/studio") ? "/studio" : "";
          window.location.href = `${baseUrl}/structure/page;${pageId}`;
        }
      }
    },
    [paneRouter, router]
  );

  const handleCreateChild = useCallback(
    (_parentSlug: string) => {
      try {
        router.navigateIntent("create", {
          type: "page",
          template: "nested-page-template",
        });
      } catch (_err) {
        toast.push({
          status: "error",
          title: "Failed to create child page",
          description: "Please try again",
        });
      }
    },
    [router, toast]
  );

  const handleOpenInPane = useCallback(
    (pageId: string) => {
      try {
        paneRouter.replaceCurrent({
          id: pageId,
          params: { type: "page" },
        });
      } catch (_err) {
        toast.push({
          status: "error",
          title: "Failed to open page",
          description: "Please try again",
        });
      }
    },
    [paneRouter, toast]
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
        description="Create your first page in Sanity Studio to see it appear in this hierarchical tree view."
        title="No pages yet"
      />
    );
  }

  return (
    <Card aria-label="Page hierarchy" padding={3} role="tree">
      <Stack space={3}>
        <TreeHeader
          loading={loading}
          onRefresh={refetch}
          totalPages={pages.length}
        />

        <TreeList
          isExpanded={isExpanded}
          onCreateChild={handleCreateChild}
          onOpenInPane={handleOpenInPane}
          onPageSelect={handlePageSelect}
          onToggleExpand={toggleExpansion}
          tree={tree}
        />
      </Stack>
    </Card>
  );
};
