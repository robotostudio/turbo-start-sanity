import { AddIcon, FolderIcon, RefreshIcon } from "@sanity/icons";
import { Button, Flex, Spinner, Text, Tooltip } from "@sanity/ui";
import React from "react";
import { IntentLink } from "sanity/router";

interface TreeHeaderProps {
  totalPages: number;
  loading?: boolean;
  onRefresh?: () => void;
  showRefresh?: boolean;
}

export const TreeHeader: React.FC<TreeHeaderProps> = ({
  totalPages,
  loading = false,
  onRefresh,
  showRefresh = true,
}) => {
  return (
    <Flex
      align="center"
      gap={2}
      paddingBottom={2}
      style={{ borderBottom: "1px solid var(--card-border-color)" }}
    >
      <FolderIcon />
      <Text weight="semibold">Pages</Text>
      <Text size={1} muted>
        ({totalPages} total)
      </Text>

      {loading && <Spinner muted size={0} />}

      <div style={{ marginLeft: "auto" }}>
        <IntentLink
          intent="create"
          params={[
            { type: "page", template: "nested-page-template" },
            { slug: "/" },
          ]}
        >
          <Tooltip
            content={
              <Text size={1}>{loading ? "Refreshing..." : "Add page"}</Text>
            }
            fallbackPlacements={["bottom"]}
            placement="top"
            portal
          >
            <Button
              icon={AddIcon}
              mode="bleed"
              tone="default"
              onClick={onRefresh}
              disabled={loading}
              aria-label={"Add page"}
            />
          </Tooltip>
        </IntentLink>
        {showRefresh && onRefresh && (
          <Tooltip
            content={
              <Text size={1}>
                {loading ? "Refreshing..." : "Refresh page tree"}
              </Text>
            }
            fallbackPlacements={["bottom"]}
            placement="top"
            portal
          >
            <Button
              icon={loading ? undefined : RefreshIcon}
              mode="bleed"
              tone="default"
              onClick={onRefresh}
              disabled={loading}
              aria-label={
                loading ? "Refreshing page tree" : "Refresh page tree"
              }
            >
              {loading && <Spinner size={0} />}
            </Button>
          </Tooltip>
        )}
      </div>
    </Flex>
  );
};
