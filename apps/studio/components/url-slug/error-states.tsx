import {
  AccessDeniedIcon,
  ErrorOutlineIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import { Badge, Flex, Stack, Text } from "@sanity/ui";

interface ErrorStateProps {
  type: "error" | "warning";
  message: string;
}

interface ErrorStatesProps {
  errors?: string[];
  warnings?: string[];
}

function ErrorState({ type, message }: ErrorStateProps) {
  const isError = type === "error";

  return (
    <Badge tone={isError ? "critical" : "caution"} padding={4} radius={2}>
      <Flex gap={2} align="center">
        {isError ? (
          <AccessDeniedIcon
            style={{
              color: "var(--card-fg-color)",
            }}
          />
        ) : (
          <WarningOutlineIcon
            style={{
              color: "var(--card-fg-color)",
            }}
          />
        )}
        <Text size={1} style={{ flex: 1 }}>
          {message}
        </Text>
      </Flex>
    </Badge>
  );
}

export function ErrorStates({ errors = [], warnings = [] }: ErrorStatesProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <Stack space={4}>
      {/* Critical errors */}
      {errors.length > 0 && (
        <Stack space={2}>
          {errors.map((error, index) => (
            <ErrorState key={index} type="error" message={error} />
          ))}
        </Stack>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Stack space={2}>
          {warnings.map((warning, index) => (
            <ErrorState key={index} type="warning" message={warning} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Common error messages that can be used
export const SLUG_ERROR_MESSAGES = {
  REQUIRED: "Slug is required.",
  INVALID_CHARACTERS:
    "Only lowercase letters, numbers, and hyphens are allowed.",
  INVALID_START_END: "Slug can't start or end with a hyphen.",
  CONSECUTIVE_HYPHENS: "Use only one hyphen between words.",
  NO_SPACES: "No spaces. Use hyphens instead.",
  NO_UNDERSCORES: "Underscores aren't allowed. Use hyphens instead.",
} as const;

export const SLUG_WARNING_MESSAGES = {
  TOO_SHORT: "Slug must be at least 3 characters long.",
  TOO_LONG: "Slug can't be longer than 60 characters.",
  ALREADY_EXISTS: "This slug is already in use. Try another.",
} as const;
