import { AddIcon, EditIcon, EllipsisVerticalIcon } from "@sanity/icons";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Text,
  Tooltip,
} from "@sanity/ui";
import { uuid } from "@sanity/uuid";
import React from "react";
import { useIntentLink } from "sanity/router";

import type { TreeNode } from "../hooks/use-pages-tree";

// Menu action types for better type safety and extensibility
export type MenuAction = {
  id: string;
  label: string;
  icon: React.ComponentType;
  tone?: "default" | "primary" | "positive" | "caution" | "critical";
  shortcut?: string;
  disabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  href?: string;
  intent?: {
    type: string;
    params?: Record<string, any>;
  };
};

export type MenuGroup = {
  id: string;
  label?: string;
  actions: MenuAction[];
};

type TreeActionMenuProps = {
  node: TreeNode;
  onNestPage?: (pageId: string, parentSlug: string) => void;
  onCreateChild?: (parentSlug: string) => void;
  onOpenInPane?: (pageId: string) => void;
  onDuplicate?: (pageId: string) => void;
  onDelete?: (pageId: string) => void;
  disabled?: boolean;
  // Extensibility props
  customMenuGroups?: MenuGroup[];
  onMenuAction?: (actionId: string, node: TreeNode) => void;
  showShortcuts?: boolean;
};

export const TreeActionMenu: React.FC<TreeActionMenuProps> = ({
  node,
  onCreateChild,
  onOpenInPane,
  onDuplicate,
  onDelete,
  disabled = false,
  customMenuGroups = [],
  onMenuAction,
  showShortcuts = false,
}) => {
  const isPage = node.type === "page";

  const pageUUId = uuid();
  const createChildLink = useIntentLink({
    intent: "create",
    params: [
      { type: "page", template: "nested-page-template" },
      {
        slug: `${node.slug}/${pageUUId}`,
        title: `${node.title} > ${pageUUId}`,
      },
    ],
  });

  const editLink = useIntentLink({
    intent: "edit",
    params: { id: node._id, type: "page" },
  });

  const handleMenuAction = (actionId: string) => {
    onMenuAction?.(actionId, node);
  };

  return (
    <Tooltip
      content={
        <Box>
          <Text size={1} weight="medium">
            Page actions
          </Text>
          <Text muted size={0}>
            {isPage ? "Edit, duplicate, or manage page" : "Create new page"}
          </Text>
        </Box>
      }
      disabled={disabled}
      placement="top"
      portal
    >
      <MenuButton
        button={
          <Button
            aria-label={`Actions for ${node.title}`}
            data-action-button
            disabled={disabled}
            icon={EllipsisVerticalIcon}
            mode="bleed"
            padding={2}
            radius={2}
            tone="default"
          />
        }
        id={`tree-actions-${node._id || node.slug}`}
        menu={
          <Menu>
            {/* Create child page - always available */}
            <MenuItem
              disabled={disabled}
              href={createChildLink.href}
              icon={AddIcon}
              onClick={createChildLink.onClick}
              text="Create child page"
            />

            {isPage && node._id && (
              <>
                <MenuDivider />

                {/* Edit page */}
                <MenuItem
                  disabled={disabled}
                  href={editLink.href}
                  icon={EditIcon}
                  onClick={editLink.onClick}
                  text="Edit page"
                />
              </>
            )}

            {/* Custom menu groups */}
            {customMenuGroups.map((group) => (
              <React.Fragment key={group.id}>
                {group.actions.length > 0 && <MenuDivider />}
                {group.actions
                  .filter((action) => !action.hidden)
                  .map((action) => (
                    <MenuItem
                      disabled={disabled || action.disabled}
                      href={action.href}
                      icon={action.icon}
                      key={action.id}
                      onClick={() => {
                        action.onClick?.();
                        handleMenuAction(action.id);
                      }}
                      text={
                        showShortcuts && action.shortcut
                          ? `${action.label} (${action.shortcut})`
                          : action.label
                      }
                      tone={action.tone}
                    />
                  ))}
              </React.Fragment>
            ))}
          </Menu>
        }
        popover={{
          placement: "bottom-end",
          portal: true,
          constrainSize: true,
        }}
      />
    </Tooltip>
  );
};
