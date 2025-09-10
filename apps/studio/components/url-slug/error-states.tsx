import { AccessDeniedIcon, WarningOutlineIcon } from "@sanity/icons";
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
    <Badge
      tone={isError ? "critical" : "caution"}
      style={{ padding: "1rem" }}
      radius={2}
    >
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
  const uniqueErrors = Array.from(new Set(errors));
  const uniqueWarnings = Array.from(new Set(warnings));
  console.log("🚀 ~ ErrorStates ~ uniqueErrors:", "uniqueWarnings:", {
    uniqueErrors,
    uniqueWarnings,
  });
  if (uniqueErrors.length === 0 && uniqueWarnings.length === 0) {
    return null;
  }

  return (
    <Stack space={4}>
      {/* Critical errors */}
      {uniqueErrors.length > 0 && (
        <Stack space={2}>
          {uniqueErrors.map((error, index) => (
            <ErrorState key={index} type="error" message={error} />
          ))}
        </Stack>
      )}

      {/* Warnings */}
      {uniqueWarnings.length > 0 && (
        <Stack space={2}>
          {uniqueWarnings.map((warning, index) => (
            <ErrorState key={index} type="warning" message={warning} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// Re-export error messages from validation utility
export {
  SLUG_ERROR_MESSAGES,
  SLUG_WARNING_MESSAGES,
} from "../../utils/slug-validation";
