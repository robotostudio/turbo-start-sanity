import { Stack } from "@sanity/ui";
import React, { memo } from "react";

import type { TreeNode } from "../hooks/use-pages-tree";
import { TreeItem } from "./tree-item";

interface TreeListProps {
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
}

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
    a.localeCompare(b),
  );

  return (
    <Stack space={1}>
      {sortedEntries.map(([key, node]) => (
        <TreeItem
          key={key}
          node={node}
          depth={depth}
          onPageSelect={onPageSelect}
          isExpanded={isExpanded(node.slug)}
          onToggleExpand={onToggleExpand}
          onCreateChild={onCreateChild}
          onOpenInPane={onOpenInPane}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        >
          {isExpanded(node.slug) && Object.keys(node.children).length > 0 && (
            <TreeListComponent
              tree={node.children}
              depth={depth + 1}
              onPageSelect={onPageSelect}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onCreateChild={onCreateChild}
              onOpenInPane={onOpenInPane}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )}
        </TreeItem>
      ))}
    </Stack>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TreeList = memo(TreeListComponent);
