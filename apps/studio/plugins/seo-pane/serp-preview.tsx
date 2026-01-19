import { SearchIcon } from "@sanity/icons";
import { Box, Card, Flex, Spinner, Stack, Text } from "@sanity/ui";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import type { DocumentInspectorProps, SanityDocument } from "sanity";
import { useEditState } from "sanity";

import { buildUrl } from "./resolvers";
import { type SiteMetadata, useMetadata } from "./use-metadata";

// ============================================================================
// Types
// ============================================================================

type SerpPreviewProps = DocumentInspectorProps & {
  baseUrl: string;
  apiUrl: string;
};

type StatusType = "success" | "warning" | "error";

type DocumentState =
  | { status: "no-document" }
  | { status: "no-slug" }
  | { status: "draft-only"; slug: string }
  | { status: "ready"; slug: string; url: string };

interface StatusConfig {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  subtitle: string;
  message: string;
  hint?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_COLORS: Record<StatusType, string> = {
  success: "var(--card-badge-positive-dot-color)",
  warning: "var(--card-badge-caution-dot-color)",
  error: "var(--card-badge-critical-dot-color)",
};

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 160;

const SHIMMER_STYLE = {
  background:
    "linear-gradient(90deg, var(--card-bg2-color) 25%, var(--card-border-color) 50%, var(--card-bg2-color) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SHIMMER_KEYFRAMES = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ICON_BOX_STYLE = {
  borderRadius: 8,
  padding: 8,
  lineHeight: 0,
  flexShrink: 0,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getTitleStatus(title: string | null): StatusType {
  if (!title) {
    return "error";
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return "warning";
  }
  return "success";
}

function getDescriptionStatus(description: string | null): StatusType {
  if (!description) {
    return "error";
  }
  const isOutOfRange =
    description.length > DESCRIPTION_MAX_LENGTH ||
    description.length < DESCRIPTION_MIN_LENGTH;
  if (isOutOfRange) {
    return "warning";
  }
  return "success";
}

function getImageStatus(image: string | null): StatusType {
  return image ? "success" : "warning";
}

function getTitleStatusMessage(status: StatusType): string {
  const messages: Record<StatusType, string> = {
    success: "Title is optimized",
    warning: "Title may be too long",
    error: "Missing title tag",
  };
  return messages[status];
}

function getDescriptionStatusMessage(status: StatusType): string {
  const messages: Record<StatusType, string> = {
    success: "Description is optimized",
    warning: "Description length could be improved",
    error: "Missing meta description",
  };
  return messages[status];
}

function getImageStatusMessage(status: StatusType): string {
  return status === "success"
    ? "Social image detected"
    : "No social image found";
}

function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function getDocumentState(
  editState: { draft: SanityDocument | null; published: SanityDocument | null },
  baseUrl: string
): DocumentState {
  const draft = editState.draft as { slug?: { current?: string } } | null;
  const published = editState.published as {
    slug?: { current?: string };
  } | null;
  const doc = draft || published;

  if (!doc) {
    return { status: "no-document" };
  }

  const slug = doc.slug?.current;
  if (!slug) {
    return { status: "no-slug" };
  }

  if (!published) {
    return { status: "draft-only", slug };
  }

  const url = buildUrl(baseUrl, slug);
  if (!url) {
    return { status: "no-slug" };
  }

  return { status: "ready", slug, url };
}

function getDocumentStateConfig(
  status: "no-document" | "no-slug" | "draft-only"
): StatusConfig {
  const configs: Record<typeof status, StatusConfig> = {
    "no-document": {
      icon: <AlertCircle size={20} color="var(--card-muted-fg-color)" />,
      bgColor: "var(--card-bg2-color)",
      title: "No Document",
      subtitle: "Document not found",
      message: "Unable to load the document. Please try refreshing the page.",
    },
    "no-slug": {
      icon: <SearchIcon style={{ fontSize: 20 }} />,
      bgColor: "var(--card-bg2-color)",
      title: "Slug Required",
      subtitle: "Configure your page URL",
      message:
        "This document needs a slug to generate its URL. Add a slug in the document editor to preview how it will appear in search results.",
    },
    "draft-only": {
      icon: (
        <AlertCircle size={20} color="var(--card-badge-caution-dot-color)" />
      ),
      bgColor: "var(--card-badge-caution-bg-color)",
      title: "Unpublished Document",
      subtitle: "Publish to see live preview",
      message:
        "This document hasn't been published yet. The SEO preview fetches metadata from the live page, so you'll need to publish this document first to see how it appears in search results. If you wish, you can publish it but add it to the noindex list so Google and other search engines won't index it.",
      hint: "Once published, refresh this panel to fetch the live metadata. To prevent indexing, consider marking this document as 'noindex' in your SEO settings.",
    },
  };

  return configs[status];
}

// ============================================================================
// Utility Components
// ============================================================================

function Skeleton({
  width = "100%",
  height = 16,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <Box
      style={{
        width,
        height,
        borderRadius: 4,
        ...SHIMMER_STYLE,
      }}
    />
  );
}

function StatusDot({ status }: { status: StatusType }) {
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: STATUS_COLORS[status],
        flexShrink: 0,
      }}
    />
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const isOver = current > max;
  const color = isOver ? "var(--card-badge-critical-dot-color)" : undefined;

  return (
    <Text
      size={0}
      muted={!isOver}
      style={{ color, fontVariantNumeric: "tabular-nums" }}
    >
      {current}/{max}
    </Text>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size={0}
      weight="medium"
      style={{ color: "var(--card-muted-fg-color)", letterSpacing: "0.05em" }}
    >
      {children}
    </Text>
  );
}

function IconBox({
  bgColor,
  children,
}: {
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <Box style={{ ...ICON_BOX_STYLE, backgroundColor: bgColor }}>
      {children}
    </Box>
  );
}

function HeaderSection({
  icon,
  bgColor,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Flex align="flex-start" gap={3}>
      <IconBox bgColor={bgColor}>{icon}</IconBox>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        <Text size={0} muted>
          {subtitle}
        </Text>
      </Stack>
    </Flex>
  );
}

// ============================================================================
// State Components
// ============================================================================

function LoadingState() {
  return (
    <Stack space={5} padding={4}>
      <HeaderSection
        icon={<Spinner />}
        bgColor="var(--card-bg2-color)"
        title="Fetching Metadata"
        subtitle="Analyzing the live page..."
      />

      <Card padding={4} radius={2} tone="transparent" border>
        <Stack space={3}>
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="80%" />
          <Skeleton height={14} width="40%" />
        </Stack>
      </Card>

      <Stack space={3}>
        <Skeleton height={12} width={80} />
        <Card
          padding={4}
          radius={3}
          shadow={1}
          style={{ backgroundColor: "#fff" }}
        >
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Skeleton height={20} width={20} />
              <Skeleton height={14} width="40%" />
            </Flex>
            <Skeleton height={20} width="95%" />
            <Stack space={2}>
              <Skeleton height={14} width="100%" />
              <Skeleton height={14} width="80%" />
            </Stack>
          </Stack>
        </Card>
      </Stack>

      <Stack space={3}>
        <Skeleton height={12} width={100} />
        <Card radius={3} overflow="hidden" shadow={1}>
          <Box
            style={{
              width: "100%",
              aspectRatio: "1.91 / 1",
              ...SHIMMER_STYLE,
            }}
          />
        </Card>
      </Stack>

      <style>{SHIMMER_KEYFRAMES}</style>
    </Stack>
  );
}

function DocumentStateMessage({
  state,
}: {
  state: Exclude<DocumentState, { status: "ready" }>;
}) {
  const config = getDocumentStateConfig(state.status);

  return (
    <Stack space={5}>
      <HeaderSection
        icon={config.icon}
        bgColor={config.bgColor}
        title={config.title}
        subtitle={config.subtitle}
      />
      <Card padding={4} radius={3} tone="transparent" border>
        <Stack space={3}>
          <Text size={1} style={{ lineHeight: 1.5 }}>
            {config.message}
          </Text>
          {config.hint && (
            <Text size={0} muted style={{ lineHeight: 1.5 }}>
              {config.hint}
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

function FetchErrorState({
  error,
  fallbackContent,
}: {
  error: string;
  fallbackContent: React.ReactNode;
}) {
  return (
    <Stack space={5}>
      <HeaderSection
        icon={
          <AlertCircle size={20} color="var(--card-badge-caution-dot-color)" />
        }
        bgColor="var(--card-badge-caution-bg-color)"
        title="Unable to Fetch Metadata"
        subtitle="The page may not be accessible"
      />
      <Card padding={4} radius={3} tone="caution" border>
        <Stack space={3}>
          <Text size={1} style={{ lineHeight: 1.5 }}>
            {error}
          </Text>
          <Text size={0} muted style={{ lineHeight: 1.5 }}>
            This could happen if the page hasn't been deployed yet, or if
            there's a network issue. Try refreshing after the page is live.
          </Text>
        </Stack>
      </Card>
      {fallbackContent}
    </Stack>
  );
}

// ============================================================================
// SERP Preview Components
// ============================================================================

function FaviconImage({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Globe size={12} color="#5f6368" />;
  }

  return (
    <img
      src={src}
      alt=""
      width={14}
      height={14}
      style={{ objectFit: "contain" }}
      onError={() => setHasError(true)}
    />
  );
}

function GooglePreview({ metadata }: { metadata: SiteMetadata }) {
  const displayUrl = metadata.url
    ? formatDisplayUrl(metadata.url)
    : "example.com";

  const titleColor = metadata.title ? "#1a0dab" : "#70757a";
  const descriptionColor = metadata.description ? "#4d5156" : "#70757a";

  return (
    <Card
      padding={4}
      radius={3}
      shadow={1}
      style={{ backgroundColor: "#fff", overflow: "hidden" }}
    >
      <Stack space={3}>
        <Box style={{ overflow: "hidden" }}>
          <div
            style={{
              color: titleColor,
              fontSize: 20,
              lineHeight: 1.3,
              fontWeight: 400,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontFamily: "arial, sans-serif",
            }}
          >
            {metadata.title || "Page title will appear here"}
          </div>
        </Box>

        <Flex align="center" gap={2} style={{ overflow: "hidden" }}>
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
              overflow: "hidden",
            }}
          >
            {metadata.favicon ? (
              <FaviconImage src={metadata.favicon} />
            ) : (
              <Globe size={12} color="#5f6368" />
            )}
          </Box>
          <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                color: "#4d5156",
                fontSize: 12,
                lineHeight: 1.4,
                fontFamily: "arial, sans-serif",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displayUrl}
            </div>
          </Box>
        </Flex>

        <Box style={{ overflow: "hidden" }}>
          <div
            style={{
              color: descriptionColor,
              fontSize: 14,
              lineHeight: 1.58,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontFamily: "arial, sans-serif",
            }}
          >
            {metadata.description ||
              "Add a meta description to improve click-through rates from search results."}
          </div>
        </Box>
      </Stack>
    </Card>
  );
}

function MetadataField({
  label,
  value,
  maxLength,
  status,
}: {
  label: string;
  value: string | null;
  maxLength?: number;
  status: StatusType;
}) {
  const charCount = value?.length ?? 0;

  return (
    <Card padding={4} radius={3} border>
      <Stack space={3}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={2}>
            <StatusDot status={status} />
            <Text size={1} weight="medium">
              {label}
            </Text>
          </Flex>
          {maxLength && <CharCount current={charCount} max={maxLength} />}
        </Flex>
        <Text
          size={1}
          muted={!value}
          style={{ wordBreak: "break-word", lineHeight: 1.5 }}
        >
          {value || "Not set"}
        </Text>
      </Stack>
    </Card>
  );
}

function SocialPreview({ metadata }: { metadata: SiteMetadata }) {
  if (!metadata.image) {
    return null;
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const grandparent = target.parentElement?.parentElement;
    if (grandparent) {
      grandparent.style.display = "none";
    }
  };

  return (
    <Stack space={3}>
      <SectionLabel>SOCIAL PREVIEW</SectionLabel>
      <Card radius={3} overflow="hidden" shadow={1}>
        <Box
          style={{
            width: "100%",
            aspectRatio: "1.91 / 1",
            position: "relative",
            backgroundColor: "#f1f3f4",
          }}
        >
          <img
            src={metadata.image}
            alt="Social preview"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={handleImageError}
          />
        </Box>
      </Card>
    </Stack>
  );
}

function StatusSummaryItem({
  status,
  message,
}: {
  status: StatusType;
  message: string;
}) {
  const isMuted = status === "error" || status === "warning";

  return (
    <Flex align="center" gap={3}>
      <StatusDot status={status} />
      <Text size={1} muted={isMuted}>
        {message}
      </Text>
    </Flex>
  );
}

function RefetchButton({
  onClick,
  isRefetching,
}: {
  onClick: () => void;
  isRefetching: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRefetching}
      aria-label={isRefetching ? "Refreshing metadata" : "Refresh metadata"}
      aria-busy={isRefetching}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 4,
        border: "none",
        borderRadius: 4,
        background: "transparent",
        cursor: isRefetching ? "default" : "pointer",
        color: "var(--card-muted-fg-color)",
        flexShrink: 0,
        opacity: isRefetching ? 0.6 : 1,
      }}
      title={isRefetching ? "Refreshing..." : "Refresh metadata"}
    >
      <RefreshCw
        size={14}
        style={{
          animation: isRefetching ? "spin 1s linear infinite" : "none",
        }}
      />
    </button>
  );
}

function MetadataContent({
  metadata,
  url,
  onRefetch,
  isRefetching,
}: {
  metadata: SiteMetadata;
  url: string;
  onRefetch: () => void;
  isRefetching: boolean;
}) {
  const titleStatus = getTitleStatus(metadata.title);
  const descStatus = getDescriptionStatus(metadata.description);
  const imageStatus = getImageStatus(metadata.image);

  return (
    <Stack space={5} style={{ marginBottom: 100 }}>
      <Flex align="flex-start" gap={3}>
        <IconBox bgColor="var(--card-badge-positive-bg-color)">
          <CheckCircle2
            size={20}
            color="var(--card-badge-positive-dot-color)"
          />
        </IconBox>
        <Stack space={2} style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <Text size={1} weight="semibold">
            Live Metadata
          </Text>
          <Flex align="center" gap={2}>
            <Box>
              <Text size={0} muted style={{ whiteSpace: "nowrap" }}>
                {url}
              </Text>
            </Box>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                lineHeight: 0,
                color: "var(--card-muted-fg-color)",
                flexShrink: 0,
              }}
            >
              <ExternalLink size={14} />
            </a>
            <RefetchButton onClick={onRefetch} isRefetching={isRefetching} />
          </Flex>
        </Stack>
      </Flex>

      <Card padding={4} radius={3} tone="transparent" border>
        <Stack space={3}>
          <StatusSummaryItem
            status={titleStatus}
            message={getTitleStatusMessage(titleStatus)}
          />
          <StatusSummaryItem
            status={descStatus}
            message={getDescriptionStatusMessage(descStatus)}
          />
          <StatusSummaryItem
            status={imageStatus}
            message={getImageStatusMessage(imageStatus)}
          />
        </Stack>
      </Card>

      <Stack space={3}>
        <SectionLabel>GOOGLE PREVIEW</SectionLabel>
        <GooglePreview metadata={metadata} />
      </Stack>

      <SocialPreview metadata={metadata} />

      <Stack space={3}>
        <SectionLabel>DETAILS</SectionLabel>
        <Stack space={3}>
          <MetadataField
            label="Title"
            value={metadata.title}
            maxLength={TITLE_MAX_LENGTH}
            status={titleStatus}
          />
          <MetadataField
            label="Description"
            value={metadata.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            status={descStatus}
          />
          <MetadataField label="URL" value={metadata.url} status="success" />
        </Stack>
      </Stack>
    </Stack>
  );
}

// ============================================================================
// Main Component
// ============================================================================

function SerpPreviewContent({
  docState,
  metadataState,
}: {
  docState: DocumentState;
  metadataState: ReturnType<typeof useMetadata>;
}) {
  if (docState.status !== "ready") {
    return <DocumentStateMessage state={docState} />;
  }

  if (metadataState.status === "loading" || metadataState.status === "idle") {
    return <LoadingState />;
  }

  if (metadataState.status === "error") {
    const fallbackContent = metadataState.fallback ? (
      <MetadataContent
        metadata={metadataState.fallback}
        url={docState.url}
        onRefetch={metadataState.refetch}
        isRefetching={metadataState.isRefetching}
      />
    ) : null;

    return (
      <FetchErrorState
        error={metadataState.error}
        fallbackContent={fallbackContent}
      />
    );
  }

  return (
    <MetadataContent
      metadata={metadataState.data}
      url={docState.url}
      onRefetch={metadataState.refetch}
      isRefetching={metadataState.isRefetching}
    />
  );
}

export function SerpPreview({
  documentId,
  documentType,
  baseUrl,
  apiUrl,
}: SerpPreviewProps) {
  const editState = useEditState(documentId, documentType);
  const docState = getDocumentState(editState, baseUrl);
  const url = docState.status === "ready" ? docState.url : null;
  const metadataState = useMetadata(url, apiUrl);

  return (
    <Box
      padding={4}
      style={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      <style>{SHIMMER_KEYFRAMES}</style>
      <SerpPreviewContent docState={docState} metadataState={metadataState} />
    </Box>
  );
}
