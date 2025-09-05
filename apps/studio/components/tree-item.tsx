import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
} from "@sanity/icons";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import React, { useCallback } from "react";

import type { TreeNode } from "../hooks/use-pages-tree";

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  onPageSelect: (pageId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (path: string) => void;
  children?: React.ReactNode;
}

export const TreeItem: React.FC<TreeItemProps> = ({
  node,
  depth,
  onPageSelect,
  isExpanded,
  onToggleExpand,
  children,
}) => {
  console.log("🚀 ~ TreeItem ~ node:", node);
  const hasChildren = node.hasChildren || Object.keys(node.children).length > 0;

  const handleClick = useCallback(() => {
    if (node.type === "page" && node._id) {
      onPageSelect(node._id);
    } else if (hasChildren) {
      onToggleExpand(node.slug);
    }
  }, [node, onPageSelect, onToggleExpand, hasChildren]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggleExpand(node.slug);
      }
    },
    [hasChildren, onToggleExpand, node.slug],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      } else if (e.key === "ArrowRight" && hasChildren && !isExpanded) {
        e.preventDefault();
        onToggleExpand(node.slug);
      } else if (e.key === "ArrowLeft" && hasChildren && isExpanded) {
        e.preventDefault();
        onToggleExpand(node.slug);
      }
    },
    [handleClick, hasChildren, isExpanded, onToggleExpand, node.slug],
  );

  const getIcon = () => {
    if (node.type === "folder") {
      return <FolderIcon style={{ width: 16, height: 16 }} />;
    }
    if (node.slug === "/") {
      return <HomeIcon style={{ width: 16, height: 16 }} />;
    }
    return <DocumentIcon style={{ width: 16, height: 16 }} />;
  };

  const getAriaLabel = () => {
    if (node.type === "folder") {
      return `${node.title} folder, ${isExpanded ? "expanded" : "collapsed"}`;
    }
    return `${node.title} page, ${node.slug}`;
  };

  return (
    <Stack space={1}>
      <Card
        padding={2}
        radius={2}
        tone={node.type === "page" ? "default" : "transparent"}
        style={{
          marginLeft: `${depth * 16}px`,
          cursor: "pointer",
          borderLeft: depth > 0 ? "1px solid var(--card-border-color)" : "none",
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role={node.type === "folder" ? "button" : "link"}
        aria-label={getAriaLabel()}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <Flex align="center" gap={2}>
          {hasChildren ? (
            <Box
              onClick={handleToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(e as any);
                }
              }}
              style={{ cursor: "pointer" }}
              tabIndex={-1}
              role="button"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.title}`}
            >
              {isExpanded ? (
                <ChevronDownIcon style={{ width: 12, height: 12 }} />
              ) : (
                <ChevronRightIcon style={{ width: 12, height: 12 }} />
              )}
            </Box>
          ) : (
            <Box style={{ width: 12, height: 12 }} />
          )}

          <Box>{getIcon()}</Box>

          <Text size={1} weight={node.type === "folder" ? "medium" : "regular"}>
            {node.title}
          </Text>

          {node.type === "page" && (
            <Text size={0} muted style={{ marginLeft: "auto" }}>
              {node.slug}
            </Text>
          )}
        </Flex>
      </Card>

      {isExpanded && hasChildren && children && (
        <Box role="group" aria-label={`${node.title} contents`}>
          {children}
        </Box>
      )}
    </Stack>
  );
};
