import { Card, Stack, Text } from "@sanity/ui";

type ValidationMessagesProps = {
  errors?: string[];
  warnings?: string[];
};

const errorTextStyle = {
  color: "var(--card-badge-critical-fg-color)",
} as const;
const warningTextStyle = {
  color: "var(--card-badge-caution-fg-color)",
} as const;

export function ValidationMessages({
  errors = [],
  warnings = [],
}: ValidationMessagesProps) {
  const uniqueErrors = Array.from(new Set(errors));
  const uniqueWarnings = Array.from(new Set(warnings));

  if (uniqueErrors.length === 0 && uniqueWarnings.length === 0) {
    return null;
  }

  return (
    <Stack space={2}>
      {uniqueErrors.map((error) => (
        <Card key={error} padding={3} radius={2} tone="critical">
          <Text size={1} style={errorTextStyle}>
            {error}
          </Text>
        </Card>
      ))}
      {uniqueWarnings.map((warning) => (
        <Card key={warning} padding={3} radius={2} tone="caution">
          <Text size={1} style={warningTextStyle}>
            {warning}
          </Text>
        </Card>
      ))}
    </Stack>
  );
}
