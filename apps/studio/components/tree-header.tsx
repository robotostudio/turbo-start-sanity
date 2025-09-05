import { FolderIcon, RefreshIcon } from "@sanity/icons";
import { Button, Flex, Spinner, Text, Tooltip } from "@sanity/ui";
import React from "react";

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
}) => (
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

    {showRefresh && onRefresh && (
      <div style={{ marginLeft: "auto" }}>
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
            // size="small"
            aria-label={loading ? "Refreshing page tree" : "Refresh page tree"}
          >
            {loading && <Spinner size={0} />}
          </Button>
        </Tooltip>
      </div>
    )}
  </Flex>
);
