import { SearchIcon } from "@sanity/icons";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import { AlertTriangle, CheckCircle2, Circle, Globe } from "lucide-react";
import { useMemo } from "react";
import type { DocumentInspectorProps } from "sanity";
import { useEditState } from "sanity";

import {
  buildUrl,
  resolveDescription,
  resolveTitle,
  truncate,
} from "./resolvers";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;
const DESCRIPTION_MIN_LENGTH = 120;

type SerpPreviewProps = DocumentInspectorProps & {
  baseUrl: string;
};

type FieldStatus = "good" | "warning" | "missing";

function getFieldStatus(
  value: string | null,
  minLength?: number,
  maxLength?: number
): FieldStatus {
  if (!value) return "missing";
  if (maxLength && value.length > maxLength) return "warning";
  if (minLength && value.length < minLength) return "warning";
  return "good";
}

function StatusIndicator({ status, label }: { status: FieldStatus; label: string }) {
  const color =
    status === "good"
      ? "var(--card-badge-positive-dot-color)"
      : status === "warning"
        ? "var(--card-badge-caution-dot-color)"
        : "var(--card-badge-critical-dot-color)";

  const Icon =
    status === "good" ? CheckCircle2 : status === "warning" ? AlertTriangle : Circle;

  return (
    <Flex align="center" gap={2}>
      <Icon size={12} color={color} fill={status === "missing" ? "none" : color} />
      <Text size={0} muted={status === "missing"}>
        {label}
      </Text>
    </Flex>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const isOver = current > max;
  return (
    <Text
      size={0}
      style={{
        color: isOver ? "var(--card-badge-critical-dot-color)" : undefined,
        fontVariantNumeric: "tabular-nums",
      }}
      muted={!isOver}
    >
      {current}/{max}
    </Text>
  );
}

export function SerpPreview({
  documentId,
  documentType,
  baseUrl,
}: SerpPreviewProps) {
  const editState = useEditState(documentId, documentType);
  const doc = editState.draft || editState.published;

  const slug = (doc?.slug as { current?: string })?.current;
  const title = doc?.title as string | undefined;
  const seoTitle = doc?.seoTitle as string | undefined;
  const seoDescription = doc?.seoDescription as string | undefined;

  const resolved = useMemo(() => {
    return {
      title: resolveTitle(seoTitle, title),
      description: resolveDescription(seoDescription),
      url: buildUrl(baseUrl, slug),
    };
  }, [seoTitle, title, seoDescription, slug, baseUrl]);

  const titleStatus = getFieldStatus(resolved.title.value, undefined, TITLE_MAX_LENGTH);
  const descriptionStatus = getFieldStatus(
    resolved.description.value,
    DESCRIPTION_MIN_LENGTH,
    DESCRIPTION_MAX_LENGTH
  );
  const urlStatus: FieldStatus = slug ? "good" : "missing";

  const domain = baseUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "example.com";

  return (
    <Stack space={4} padding={3}>
      {/* Header */}
      <Flex align="flex-start" gap={3}>
        <Box
          style={{
            backgroundColor: "var(--card-bg2-color)",
            borderRadius: 6,
            padding: 6,
            lineHeight: 0,
          }}
        >
          <SearchIcon style={{ fontSize: 18 }} />
        </Box>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Search Appearance
          </Text>
          <Text size={0} muted>
            How this page looks in Google
          </Text>
        </Stack>
      </Flex>

      {/* Status Row */}
      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={2}>
          <StatusIndicator
            status={titleStatus}
            label={
              titleStatus === "good"
                ? "Title optimized"
                : titleStatus === "warning"
                  ? "Title too long"
                  : "Missing title"
            }
          />
          <StatusIndicator
            status={descriptionStatus}
            label={
              descriptionStatus === "good"
                ? "Description optimized"
                : descriptionStatus === "warning"
                  ? "Description needs work"
                  : "Missing description"
            }
          />
          <StatusIndicator
            status={urlStatus}
            label={urlStatus === "good" ? "URL configured" : "Missing URL"}
          />
        </Stack>
      </Card>

      {/* SERP Preview */}
      <Stack space={2}>
        <Text size={0} weight="medium" muted>
          PREVIEW
        </Text>
        <Card padding={3} radius={2} shadow={1} style={{ backgroundColor: "#fff" }}>
          <Stack space={2}>
            {/* Favicon + Domain */}
            <Flex align="center" gap={2}>
              <Box
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: "#f1f3f4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Globe size={10} color="#5f6368" />
              </Box>
              <Text
                size={0}
                style={{
                  color: "#4d5156",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {domain}
              </Text>
            </Flex>

            {/* Title */}
            <Text
              size={1}
              style={{
                color: resolved.title.value ? "#1a0dab" : "#70757a",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {resolved.title.value
                ? truncate(resolved.title.value, TITLE_MAX_LENGTH)
                : "Page title appears here"}
            </Text>

            {/* Description */}
            <Text
              size={0}
              style={{
                color: resolved.description.value ? "#4d5156" : "#70757a",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {resolved.description.value
                ? truncate(resolved.description.value, DESCRIPTION_MAX_LENGTH)
                : "Meta description appears here. Add one for better click-through rates."}
            </Text>
          </Stack>
        </Card>
      </Stack>

      {/* Field Details */}
      <Stack space={2}>
        <Text size={0} weight="medium" muted>
          DETAILS
        </Text>

        <Stack space={2}>
          {/* Title */}
          <Card padding={3} radius={2} border>
            <Stack space={2}>
              <Flex justify="space-between" align="center">
                <Text size={0} weight="medium">
                  Title
                </Text>
                <CharCount
                  current={resolved.title.value?.length || 0}
                  max={TITLE_MAX_LENGTH}
                />
              </Flex>
              <Text size={0} muted style={{ wordBreak: "break-word" }}>
                {resolved.title.value || "—"}
              </Text>
              {resolved.title.source && (
                <Text size={0} muted>
                  via{" "}
                  <code style={{ fontSize: "inherit", opacity: 0.8 }}>
                    {resolved.title.source}
                  </code>
                </Text>
              )}
            </Stack>
          </Card>

          {/* Description */}
          <Card padding={3} radius={2} border>
            <Stack space={2}>
              <Flex justify="space-between" align="center">
                <Text size={0} weight="medium">
                  Description
                </Text>
                <CharCount
                  current={resolved.description.value?.length || 0}
                  max={DESCRIPTION_MAX_LENGTH}
                />
              </Flex>
              <Text size={0} muted style={{ wordBreak: "break-word" }}>
                {resolved.description.value || "—"}
              </Text>
              {resolved.description.source && (
                <Text size={0} muted>
                  via{" "}
                  <code style={{ fontSize: "inherit", opacity: 0.8 }}>
                    {resolved.description.source}
                  </code>
                </Text>
              )}
            </Stack>
          </Card>

          {/* URL */}
          <Card padding={3} radius={2} border>
            <Stack space={2}>
              <Text size={0} weight="medium">
                URL
              </Text>
              <Text
                size={0}
                muted
                style={{ wordBreak: "break-all" }}
              >
                {resolved.url || "—"}
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}
