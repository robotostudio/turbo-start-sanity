import { Stack } from "@sanity/ui";
import type React from "react";
import { memo } from "react";

import type { TreeNode } from "../hooks/use-pages-tree";
import { TreeItem } from "./tree-item";

type TreeListProps = {
  tree: Record<string, TreeNode>;
  depth?: number;
  onPageSelect: (pageId: string) => void;
  isExpanded: (path: string) => boolean;
  onToggleExpand: (path: string) => void;
  // Action handlers
  onCreateChild?: (parentSlug: string) => void;
  onOpenInPane?: (pageId: string) => void;
  onDuplicate?: (pageId: string) => void;
  onDelete?: (pageId: string) => void;
};

const TreeListComponent: React.FC<TreeListProps> = ({
  tree,
  depth = 0,
  onPageSelect,
  isExpanded,
  onToggleExpand,
  onCreateChild,
  onOpenInPane,
  onDuplicate,
  onDelete,
}) => {
  const sortedEntries = Object.entries(tree).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <Stack space={1}>
      {sortedEntries.map(([key, node]) => (
        <TreeItem
          depth={depth}
          isExpanded={isExpanded(node.slug)}
          key={key}
          node={node}
          onCreateChild={onCreateChild}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onOpenInPane={onOpenInPane}
          onPageSelect={onPageSelect}
          onToggleExpand={onToggleExpand}
        >
          {isExpanded(node.slug) && Object.keys(node.children).length > 0 && (
            <TreeListComponent
              depth={depth + 1}
              isExpanded={isExpanded}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onOpenInPane={onOpenInPane}
              onPageSelect={onPageSelect}
              onToggleExpand={onToggleExpand}
              tree={node.children}
            />
          )}
        </TreeItem>
      ))}
    </Stack>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TreeList = memo(TreeListComponent);
