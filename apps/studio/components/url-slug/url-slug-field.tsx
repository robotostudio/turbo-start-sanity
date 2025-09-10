import {
  ChevronRightIcon,
  CopyIcon,
  InfoOutlineIcon,
  SparklesIcon,
} from "@sanity/icons";
import {
  Box,
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@sanity/ui";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  getPublishedId,
  type ObjectFieldProps,
  type SanityDocument,
  type SlugValue,
  useFormValue,
  useValidationStatus,
} from "sanity";
import { styled } from "styled-components";

import { getDocumentPath } from "../../utils/helper";
import { validateSlugForDocumentType } from "../../utils/slug-validation";
import { ErrorStates } from "./error-states";
import { useSlugGeneration } from "./use-slug";

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;

const CollapseContainer = styled.div<{ expanded: boolean }>`
  overflow: hidden;
  transition:
    max-height 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  max-height: ${({ expanded }) => (expanded ? "500px" : "0")};
  opacity: ${({ expanded }) => (expanded ? "1" : "0")};
`;

const PathSegmentChip = styled(Card)`
  background-color: var(--card-bg-color);
  border: 1px solid var(--card-border-color);
  transition: all 0.2s ease-in-out;
  cursor: default;

  &:hover {
    background-color: var(--card-hover-bg-color);
    border-color: var(--card-focus-ring-color);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const AccordionButton = styled(Box)`
  &:hover {
    background-color: var(--card-hover-bg-color);
  }

  &:focus {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: -2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: -2px;
  }
`;

const InputContainer = styled(Box)`
  border: 1px solid var(--card-border-color);
  border-radius: var(--card-radius-2);
  padding-right: 2px;
  transition: border-color 0.2s ease;
  display: flex !important;
  width: 100% !important;
  align-items: center;

  & > span {
    width: 100%;
  }
  &:hover {
    border-color: var(--card-focus-ring-color);
  }

  &:focus-within {
    border-color: var(--card-focus-ring-color);
  }
`;

const StyledTextInput = styled(TextInput)`
  border: 0 !important;
  box-shadow: none !important;
  background-color: transparent;
  flex: 1;
  flex-grow: 1;
  width: 100% !important;
  min-width: 0;
  &:focus {
    box-shadow: none !important;
  }
`;

export function UrlSlugFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const document = useFormValue([]) as SanityDocument;
  const publishedId = getPublishedId(document?._id);
  const sanityValidation = useValidationStatus(publishedId, document?._type);
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
  } = props;
  const {
    pathSegments,
    finalSlug,
    generateSlugFromTitle,
    handleUpdateFinalSlug,
    handleUpdatePathSegment,
    handleAddPathSegment,
    handleRemovePathSegment,
    getPathSegmentOptions,
    validation,
  } = useSlugGeneration({ onChange });

  const slugValidationError = useMemo(
    () =>
      sanityValidation.validation.find(
        (v) =>
          (v?.path.includes("current") || v?.path.includes("slug")) &&
          v.message,
      ),
    [sanityValidation.validation],
  );

  const [isPathExpanded, setIsPathExpanded] = useState(false);
  const currentSlug = value?.current || "";

  // Legacy validation for slug format (keeping for backward compatibility)
  const slugFormatErrors = useMemo(() => {
    if (!document?._type) return [];
    return validateSlugForDocumentType(currentSlug, document._type);
  }, [currentSlug, document?._type]);

  const handleFinalSlugChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleUpdateFinalSlug(e.target.value);
    },
    [handleUpdateFinalSlug],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsPathExpanded(!isPathExpanded);
      }
    },
    [isPathExpanded],
  );

  const localizedPathname = getDocumentPath({
    ...document,
    slug: currentSlug,
  });

  const fullUrl = `${presentationOriginUrl ?? "https://www.robotostudio.com"}${localizedPathname}`;

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
  }, [fullUrl]);

  return (
    <Stack space={4}>
      {/* URL Slug Header */}
      <Flex align="center" gap={2}>
        <Text size={3} weight="semibold">
          {title || "URL Slug"}{" "}
          <span style={{ color: "var(--card-critical-fg-color)" }}>*</span>
        </Text>
        <Tooltip
          content={
            <Box padding={3} style={{ maxWidth: "300px" }}>
              <Text size={1}>
                {description ||
                  "The web address for this content. This will be used to create the URL where visitors can find this page."}
              </Text>
            </Box>
          }
          placement="top"
        >
          <InfoOutlineIcon style={{ color: "var(--card-muted-fg-color)" }} />
        </Tooltip>
      </Flex>

      {/* URL Path Accordion Section */}
      <Card padding={0} radius={2} border style={{ overflow: "hidden" }}>
        {/* Accordion Header */}
        <AccordionButton
          as="button"
          onClick={() => setIsPathExpanded(!isPathExpanded)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: "40px",
            padding: "16px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "transparent",
            cursor: "pointer",
            transition: "background-color 0.2s ease-in-out",
          }}
          aria-expanded={isPathExpanded}
          aria-controls="url-path-content"
          aria-label={`${isPathExpanded ? "Collapse" : "Expand"} URL path details`}
          role="button"
          tabIndex={0}
        >
          <Flex
            align="center"
            justify="space-between"
            style={{ height: "100%" }}
          >
            <Text size={2} weight="medium" style={{ lineHeight: 1 }}>
              URL Path
            </Text>
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                transform: isPathExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease-in-out",
              }}
            >
              <ChevronRightIcon style={{ width: "16px", height: "16px" }} />
            </Box>
          </Flex>
        </AccordionButton>

        {/* Accordion Content */}
        <CollapseContainer expanded={isPathExpanded}>
          <Box
            id="url-path-content"
            padding={4}
            style={{
              borderTop: "1px solid var(--card-border-color)",
              backgroundColor: "var(--card-muted-bg-color)",
            }}
          >
            <Stack space={4}>
              {/* Path Segments Editor */}
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Path Segments (before final slug)
                </Text>
                {pathSegments.length > 0 ? (
                  <Flex align="center" gap={1} wrap="wrap">
                    <Text size={1} muted>
                      /
                    </Text>
                    {pathSegments.map((segment, index) => {
                      const segmentOptions = getPathSegmentOptions(index);
                      const allSegmentOptions = Array.from(
                        new Set([segment, ...segmentOptions]),
                      );

                      return (
                        <Flex
                          key={`${segment}-${index}`}
                          align="center"
                          gap={1}
                        >
                          <PathSegmentChip
                            padding={2}
                            radius={1}
                            tone="transparent"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <select
                              value={segment}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                handleUpdatePathSegment(
                                  index,
                                  e.currentTarget.value,
                                );
                              }}
                              style={{
                                fontFamily: "var(--font-family-mono)",
                                fontSize: "12px",
                                border: "none",
                                background: "transparent",
                                padding: "2px 4px",
                                minWidth: "60px",
                                width: `${Math.max(segment.length * 8, 60)}px`,
                                outline: "none",
                              }}
                              disabled={readOnly}
                            >
                              {allSegmentOptions.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <Button
                              icon={<Text size={0}>×</Text>}
                              mode="ghost"
                              padding={1}
                              onClick={() => {
                                handleRemovePathSegment(index);
                              }}
                              disabled={readOnly}
                              title="Remove segment"
                            />
                          </PathSegmentChip>
                          <Text size={1} muted>
                            /
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                ) : (
                  <>
                    <Text size={1} muted>
                      No path segments. The URL will be directly under the root
                      (/).
                    </Text>
                  </>
                )}
                <>
                  <Flex gap={2}>
                    <Button
                      text="Add Segment"
                      mode="ghost"
                      tone="primary"
                      fontSize={1}
                      onClick={() => {
                        handleAddPathSegment();
                      }}
                      disabled={readOnly}
                    />
                  </Flex>
                </>
              </Stack>
            </Stack>
          </Box>
        </CollapseContainer>
      </Card>

      {/* Final URL slug section */}
      <Stack space={3}>
        <Text size={2} weight="medium">
          Final URL slug
          <span style={{ color: "var(--card-critical-fg-color)" }}>*</span>
        </Text>

        {/* Input container with embedded button */}
        <InputContainer>
          <StyledTextInput
            value={finalSlug}
            onChange={handleFinalSlugChange}
            placeholder="Define your URL slug (this-is-slug)"
            disabled={readOnly}
            style={{
              fontFamily: "var(--font-family-mono)",
            }}
            aria-describedby="slug-helper-text"
          />

          <Button
            icon={SparklesIcon}
            text="Use title"
            style={{ marginLeft: "auto" }}
            onClick={generateSlugFromTitle}
            disabled={!document?.title || readOnly}
            mode="ghost"
            tone="primary"
            fontSize={1}
            padding={2}
            aria-label="Generate slug from title"
          />
        </InputContainer>

        {/* Helper Text */}
        <Text size={1} muted id="slug-helper-text">
          Enter only the page name (e.g., &ldquo;about-us&rdquo;,
          &ldquo;contact&rdquo;). Path segments can be edited in the URL Path
          section above. Only lowercase letters, numbers, and hyphens are
          allowed.
        </Text>
      </Stack>

      {currentSlug && (
        <Stack space={2}>
          <Text size={2} weight="medium">
            Complete URL Preview:
          </Text>
          <Card
            padding={3}
            radius={2}
            tone="transparent"
            style={{
              backgroundColor: "var(--card-muted-bg-color)",
            }}
          >
            <Flex align="center" justify="space-between">
              <Text
                size={1}
                style={{
                  fontFamily: "var(--font-family-mono)",
                  wordBreak: "break-all",
                  flex: 1,
                }}
              >
                {fullUrl}
              </Text>
              <Button
                icon={CopyIcon}
                onClick={handleCopyUrl}
                title="Copy URL"
                mode="ghost"
                padding={2}
              />
            </Flex>
          </Card>
        </Stack>
      )}

      {/* Error States from Hook Validation */}
      <ErrorStates
        errors={[
          ...validation.errors,
          ...slugFormatErrors,
          ...(slugValidationError ? [slugValidationError.message] : []),
        ]}
        warnings={validation.warnings}
      />
    </Stack>
  );
}
