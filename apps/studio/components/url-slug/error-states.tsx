import { AccessDeniedIcon, WarningOutlineIcon } from "@sanity/icons";
import { Badge, Flex, Stack, Text } from "@sanity/ui";
import { memo, useMemo } from "react";

type ErrorStateItemProps = {
  type: "error" | "warning";
  message: string;
  id: string;
};

type ErrorStatesProps = {
  errors?: string[];
  warnings?: string[];
};

// Memoized individual error state component for performance
const ErrorStateItem = memo(function ErrorStateItemComponent({
  type,
  message,
  id,
}: ErrorStateItemProps) {
  const isErrorType = type === "error";

  // Memoize icon and styling to prevent re-renders
  const { IconComponent, badgeTone, ariaLabel } = useMemo(
    () => ({
      IconComponent: isErrorType ? AccessDeniedIcon : WarningOutlineIcon,
      badgeTone: isErrorType ? ("critical" as const) : ("caution" as const),
      ariaLabel: isErrorType ? "Error" : "Warning",
    }),
    [isErrorType]
  );

  return (
    <Badge
      aria-labelledby={`error-${id}`}
      radius={2}
      role="alert"
      style={{ padding: "1rem" }}
      tone={badgeTone}
    >
      <Flex align="center" gap={2}>
        <IconComponent
          aria-label={ariaLabel}
          style={{
            color: "var(--card-fg-color)",
          }}
        />
        <Text id={`error-${id}`} size={1} style={{ flex: 1 }}>
          {message}
        </Text>
      </Flex>
    </Badge>
  );
});

// Helper function to generate unique IDs for accessibility
function generateErrorId(message: string, index: number): string {
  return `${message.slice(0, 10).replace(/\s+/g, "-").toLowerCase()}-${index}`;
}

// Memoized main component for performance
export const ErrorStates = memo(function ErrorStatesComponent({
  errors = [],
  warnings = [],
}: ErrorStatesProps) {
  // Memoize the unique arrays to prevent unnecessary re-renders
  const { errorItems, warningItems, hasIssues } = useMemo(() => {
    const uniqueErrors = Array.from(new Set(errors));
    const uniqueWarnings = Array.from(new Set(warnings));
    const hasAnyIssues = uniqueErrors.length > 0 || uniqueWarnings.length > 0;

    return {
      errorItems: uniqueErrors,
      warningItems: uniqueWarnings,
      hasIssues: hasAnyIssues,
    };
  }, [errors, warnings]);

  // Early return if no issues
  if (!hasIssues) {
    return null;
  }

  return (
    <Stack aria-label="Validation messages" role="region" space={4}>
      {/* Critical errors */}
      {errorItems.length > 0 && (
        <Stack aria-label="Errors" role="group" space={2}>
          {errorItems.map((error, index) => (
            <ErrorStateItem
              id={generateErrorId(error, index)}
              key={error}
              message={error}
              type="error"
            />
          ))}
        </Stack>
      )}

      {/* Warnings */}
      {warningItems.length > 0 && (
        <Stack aria-label="Warnings" role="group" space={2}>
          {warningItems.map((warning, index) => (
            <ErrorStateItem
              id={generateErrorId(warning, index)}
              key={warning}
              message={warning}
              type="warning"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
});
