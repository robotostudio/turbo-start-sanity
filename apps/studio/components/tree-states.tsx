import { RefreshIcon } from "@sanity/icons";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import React from "react";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryLabel = "Try Again",
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = React.useCallback(async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsRetrying(false), 500);
    }
  }, [onRetry]);

  return (
    <Card padding={4} tone="critical" radius={2}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={2} weight="semibold">
            Unable to load pages
          </Text>
          <Text size={1} style={{ color: "var(--card-muted-fg-color)" }}>
            {error}
          </Text>
        </Stack>

        {onRetry && (
          <Flex justify="flex-start">
            <Button
              icon={RefreshIcon}
              text={isRetrying ? "Retrying..." : retryLabel}
              tone="critical"
              mode="default"
              onClick={handleRetry}
              disabled={isRetrying}
              // size="small"
            />
          </Flex>
        )}
      </Stack>
    </Card>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No pages found",
  description = "Create your first page to see the tree structure.",
  illustration,
}) => (
  <Card padding={4} radius={2} tone="transparent">
    <Stack space={4} style={{ textAlign: "center" }}>
      {illustration && <Flex justify="center">{illustration}</Flex>}

      <Stack space={2}>
        <Text
          size={2}
          weight="medium"
          style={{ color: "var(--card-fg-color)" }}
        >
          {title}
        </Text>
        <Text size={1} style={{ color: "var(--card-muted-fg-color)" }}>
          {description}
        </Text>
      </Stack>
    </Stack>
  </Card>
);
