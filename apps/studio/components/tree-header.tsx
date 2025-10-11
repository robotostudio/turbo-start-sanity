import { AddIcon, FolderIcon, RefreshIcon } from "@sanity/icons";
import { Button, Flex, Spinner, Text, Tooltip } from "@sanity/ui";
import type React from "react";
import { IntentLink } from "sanity/router";

type TreeHeaderProps = {
  totalPages: number;
  loading?: boolean;
  onRefresh?: () => void;
  showRefresh?: boolean;
};

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
    <Text muted size={1}>
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
            aria-label={"Add page"}
            disabled={loading}
            icon={AddIcon}
            mode="bleed"
            onClick={onRefresh}
            tone="default"
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
            aria-label={loading ? "Refreshing page tree" : "Refresh page tree"}
            disabled={loading}
            icon={loading ? undefined : RefreshIcon}
            mode="bleed"
            onClick={onRefresh}
            tone="default"
          >
            {loading && <Spinner size={0} />}
          </Button>
        </Tooltip>
      )}
    </div>
  </Flex>
);
