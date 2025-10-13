import { RefreshIcon } from "@sanity/icons";
import { Button, Card, Flex, Stack, Text } from "@sanity/ui";
import React from "react";

type ErrorStateProps = {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryLabel = "Try Again",
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = React.useCallback(async () => {
    if (!onRetry) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsRetrying(false), 500);
    }
  }, [onRetry]);

  return (
    <Card padding={4} radius={2} tone="critical">
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
              disabled={isRetrying}
              icon={RefreshIcon}
              mode="default"
              onClick={handleRetry}
              text={isRetrying ? "Retrying..." : retryLabel}
              tone="critical"
              // size="small"
            />
          </Flex>
        )}
      </Stack>
    </Card>
  );
};

type EmptyStateProps = {
  title?: string;
  description?: string;
  illustration?: React.ReactNode;
};

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
          style={{ color: "var(--card-fg-color)" }}
          weight="medium"
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
