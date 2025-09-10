import { Box, Card, Flex, Stack } from "@sanity/ui";
import React from "react";
import styled, { css, keyframes } from "styled-components";

// Animation keyframes
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

// Base skeleton styling with Sanity UI theming
const skeletonMixin = css`
  background: linear-gradient(
    90deg,
    hsl(
        var(--card-skeleton-color-hue, 0),
        var(--card-skeleton-color-saturation, 0%),
        var(--card-skeleton-color-lightness-from, 95%)
      )
      0%,
    hsl(
        var(--card-skeleton-color-hue, 0),
        var(--card-skeleton-color-saturation, 0%),
        var(--card-skeleton-color-lightness-to, 88%)
      )
      50%,
    hsl(
        var(--card-skeleton-color-hue, 0),
        var(--card-skeleton-color-saturation, 0%),
        var(--card-skeleton-color-lightness-from, 95%)
      )
      100%
  );
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: var(--radius-1, 3px);

  /* Dark mode support */
  [data-scheme="dark"] & {
    --card-skeleton-color-lightness-from: 12%;
    --card-skeleton-color-lightness-to: 18%;
  }

  /* Light mode (default) */
  :root {
    --card-skeleton-color-hue: 0;
    --card-skeleton-color-saturation: 0%;
    --card-skeleton-color-lightness-from: 95%;
    --card-skeleton-color-lightness-to: 88%;
  }
`;

// Styled components
const StyledSkeletonBox = styled(Box)<{
  width?: string;
  height?: string;
  delay?: number;
}>`
  ${skeletonMixin}
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "16px"};
  animation-delay: ${(props) => (props.delay ? `${props.delay}ms` : "0ms")};
`;

const SkeletonTreeItemContainer = styled(Card)<{
  depth: number;
  animationDelay?: number;
}>`
  margin-left: ${(props) => props.depth * 16}px;
  border-left: ${(props) =>
    props.depth > 0 ? "1px solid var(--card-border-color)" : "none"};
  animation: ${fadeIn} 0.3s ease-out;
  animation-delay: ${(props) =>
    props.animationDelay ? `${props.animationDelay}ms` : "0ms"};
  animation-fill-mode: both;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--card-bg-color);
  }
`;

const SkeletonIcon = styled(StyledSkeletonBox)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;

const SkeletonChevron = styled(StyledSkeletonBox)`
  width: 12px;
  height: 12px;
  flex-shrink: 0;
`;

const LoadingContainer = styled.div<{ isVisible: boolean }>`
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  transform: translateY(${(props) => (props.isVisible ? "0" : "8px")});
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const LoadingMessage = styled.p`
  margin: 0;
  color: var(--card-muted-fg-color);
  font-size: var(--font-size-1);
  animation: ${pulse} 2s ease-in-out infinite;
  text-align: center;
`;

const SkeletonHeader = styled(Flex)`
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--card-border-color);

  & > * {
    animation: ${fadeIn} 0.4s ease-out;
    animation-fill-mode: both;
  }

  & > *:nth-child(1) {
    animation-delay: 0ms;
  }
  & > *:nth-child(2) {
    animation-delay: 100ms;
  }
  & > *:nth-child(3) {
    animation-delay: 200ms;
  }
  & > *:nth-child(4) {
    animation-delay: 300ms;
  }
`;

// Component interfaces
interface SkeletonBoxProps {
  width?: string;
  height?: string;
  delay?: number;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = "100%",
  height = "16px",
  delay = 0,
}) => <StyledSkeletonBox width={width} height={height} delay={delay} />;

interface SkeletonTreeItemProps {
  depth: number;
  hasChildren?: boolean;
  showPath?: boolean;
  variant?: "folder" | "page";
  animationDelay?: number;
}

const SkeletonTreeItem: React.FC<SkeletonTreeItemProps> = ({
  depth,
  hasChildren = false,
  showPath = false,
  variant = "page",
  animationDelay = 0,
}) => (
  <SkeletonTreeItemContainer
    padding={2}
    radius={2}
    tone="transparent"
    depth={depth}
    animationDelay={animationDelay}
  >
    <Flex align="center" gap={2}>
      {hasChildren ? (
        <SkeletonChevron />
      ) : (
        <Box style={{ width: 12, height: 12 }} />
      )}

      <SkeletonIcon />

      {/* Title skeleton - varies by type */}
      <SkeletonBox
        width={variant === "folder" ? "100px" : "140px"}
        height="14px"
      />

      {showPath && variant === "page" && (
        <Box style={{ marginLeft: "auto" }}>
          <SkeletonBox width="60px" height="12px" />
        </Box>
      )}
    </Flex>
  </SkeletonTreeItemContainer>
);

interface SkeletonHeaderProps {
  showRefresh?: boolean;
}

const SkeletonTreeHeader: React.FC<SkeletonHeaderProps> = ({
  showRefresh = true,
}) => (
  <SkeletonHeader align="center" gap={2}>
    <SkeletonIcon />
    <SkeletonBox width="60px" height="16px" />
    <SkeletonBox width="80px" height="14px" />

    {showRefresh && (
      <Box style={{ marginLeft: "auto" }}>
        <SkeletonBox width="32px" height="32px" />
      </Box>
    )}
  </SkeletonHeader>
);

interface SkeletonTreeProps {
  itemCount?: number;
  maxDepth?: number;
  showHeader?: boolean;
  realistic?: boolean;
}

export const SkeletonTree: React.FC<SkeletonTreeProps> = ({
  itemCount = 8,
  maxDepth = 2,
  showHeader = true,
  realistic = true,
}) => {
  // Generate realistic tree structure for skeleton
  const generateSkeletonItems = React.useMemo(() => {
    if (!realistic) {
      return Array.from({ length: itemCount }, (_, i) => ({
        depth: Math.floor(i / 3),
        hasChildren: i % 3 === 0,
        showPath: true,
        variant: (i % 3 === 0 ? "folder" : "page") as "folder" | "page",
        animationDelay: i * 50,
      }));
    }

    const items: Array<{
      depth: number;
      hasChildren: boolean;
      showPath: boolean;
      variant: "folder" | "page";
      animationDelay: number;
    }> = [];

    // Add home page
    items.push({
      depth: 0,
      hasChildren: false,
      showPath: true,
      variant: "page",
      animationDelay: 0,
    });

    // Add some folder structures
    const folderNames = ["about", "services", "products", "blog"];

    for (let i = 0; i < Math.min(folderNames.length, itemCount - 1); i++) {
      if (items.length >= itemCount) break;

      const hasSubPages = Math.random() > 0.4;

      // Add folder
      if (hasSubPages && maxDepth > 0) {
        items.push({
          depth: 0,
          hasChildren: true,
          showPath: false,
          variant: "folder",
          animationDelay: items.length * 80,
        });

        // Add sub-pages
        const subPageCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < subPageCount && items.length < itemCount; j++) {
          const depth = Math.min(maxDepth, 1);
          items.push({
            depth,
            hasChildren: false,
            showPath: true,
            variant: "page",
            animationDelay: items.length * 80,
          });
        }
      } else {
        // Add standalone page
        items.push({
          depth: 0,
          hasChildren: false,
          showPath: true,
          variant: "page",
          animationDelay: items.length * 80,
        });
      }
    }

    return items.slice(0, itemCount);
  }, [itemCount, maxDepth, realistic]);

  const skeletonItems = generateSkeletonItems;

  return (
    <Card padding={3} role="status" aria-label="Loading page tree">
      <Stack space={3}>
        {showHeader && <SkeletonTreeHeader />}

        <Stack space={1}>
          {skeletonItems.map((item, index) => (
            <SkeletonTreeItem
              key={`skeleton-${index}`}
              depth={item.depth}
              hasChildren={item.hasChildren}
              showPath={item.showPath}
              variant={item.variant as "folder" | "page"}
              animationDelay={item.animationDelay}
            />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};

// Progressive loading skeleton that simulates real loading behavior
export const ProgressiveSkeletonTree: React.FC<SkeletonTreeProps> = (props) => {
  const [currentItemCount, setCurrentItemCount] = React.useState(2);
  const [phase, setPhase] = React.useState<"initial" | "loading" | "complete">(
    "initial",
  );

  React.useEffect(() => {
    const maxItems = props.itemCount || 8;

    if (currentItemCount < maxItems) {
      const timer = setTimeout(
        () => {
          setPhase("loading");
          setCurrentItemCount((prev) => Math.min(prev + 2, maxItems));
        },
        200 + Math.random() * 300,
      ); // Stagger for realism

      return () => clearTimeout(timer);
    } else {
      setPhase("complete");
    }
  }, [currentItemCount, props.itemCount]);

  return (
    <SkeletonTree
      {...props}
      itemCount={currentItemCount}
      realistic={phase !== "initial"}
    />
  );
};

// Enhanced loading state with fade-in animation
export const EnhancedLoadingState: React.FC<{
  message?: string;
  progressive?: boolean;
}> = ({ message = "Loading page tree...", progressive = true }) => {
  const SkeletonComponent = progressive
    ? ProgressiveSkeletonTree
    : SkeletonTree;

  return (
    <LoadingContainer isVisible>
      <SkeletonComponent
        itemCount={40}
        maxDepth={3}
        showHeader={true}
        realistic={true}
      />
      {message && (
        <Box paddingTop={2}>
          <LoadingMessage>{message}</LoadingMessage>
        </Box>
      )}
    </LoadingContainer>
  );
};
