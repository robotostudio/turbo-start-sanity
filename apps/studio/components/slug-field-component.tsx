import {
  CopyIcon,
  GenerateIcon,
  LinkIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  getPublishedId,
  type ObjectFieldProps,
  type SanityDocument,
  set,
  type SlugValue,
  unset,
  useFormValue,
  useValidationStatus,
} from "sanity";
import slugify from "slugify";
import { styled } from "styled-components";

import { getDocumentPath } from "../utils/helper";
import {
  validateSlugForDocumentType,
  cleanSlug,
} from "../utils/slug-validation";

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;

const CopyButton = styled(Button)`
  cursor: pointer;
`;

const GenerateButton = styled(Button)`
  cursor: pointer;
`;

const SlugInput = styled(TextInput)`
  font-family: monospace;
  font-size: 14px;
`;

const PathSegment = styled(Card)`
  background: var(--card-muted-bg-color);
  border: 1px solid var(--card-border-color);
`;

const UrlPreview = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: var(--card-muted-fg-color);
  background: var(--card-muted-bg-color);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--card-border-color);
  word-break: break-all;
  overflow-wrap: break-word;
`;

export function PathnameFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const document = useFormValue([]) as SanityDocument;
  const publishedId = getPublishedId(document?._id);
  const validation = useValidationStatus(publishedId, document?._type);
  const slugValidationError = useMemo(
    () =>
      validation.validation.find(
        (v) =>
          (v?.path.includes("current") || v?.path.includes("slug")) &&
          v.message,
      ),
    [validation.validation],
  );

  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
  } = props;

  const [isEditing, setIsEditing] = useState(false);

  const currentSlug = value?.current || "";
  const segments = useMemo(
    () => currentSlug.split("/").filter(Boolean),
    [currentSlug],
  );

  // Validation for slug format
  const slugFormatErrors = useMemo(() => {
    if (!document?._type) return [];

    return validateSlugForDocumentType(currentSlug, document._type);
  }, [currentSlug, document?._type]);

  const handleChange = useCallback(
    (newValue?: string) => {
      // Validate the new value and set validation errors
      const patch =
        typeof newValue === "string"
          ? set({
              current: newValue,
              _type: "slug",
            })
          : unset();

      onChange(patch);
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Allow users to type anything - don't clean while typing
      handleChange(rawValue);
    },
    [handleChange],
  );
  const handleGenerate = useCallback(() => {
    const title = document?.title as string | undefined;
    if (!title) return;

    const newSlug = slugify(title, {
      lower: true,
      remove: /[^a-zA-Z0-9\s-]/g,
    });

    // Keep existing path structure if it exists
    if (segments.length > 1) {
      const basePath = segments.slice(0, -1).join("/");
      const fullPath = `/${basePath}/${newSlug}`;
      handleChange(fullPath);
    } else {
      const fullPath = `/${newSlug}`;
      handleChange(fullPath);
    }
  }, [document?.title, handleChange, segments]);

  const handleCleanUp = useCallback(() => {
    if (!currentSlug || !document?._type) return;

    const cleanValue = cleanSlug(currentSlug, document._type);
    handleChange(cleanValue);
  }, [currentSlug, document?._type, handleChange]);

  const localizedPathname = getDocumentPath({
    ...document,
    slug: currentSlug,
  });

  const fullUrl = `${presentationOriginUrl ?? ""}${localizedPathname}`;

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
  }, [fullUrl]);

  return (
    <Stack space={3}>
      {/* Header */}
      <Stack space={2}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        {description && (
          <Text size={1} muted>
            {description}
          </Text>
        )}
      </Stack>

      {/* URL Preview */}
      {currentSlug && (
        <Stack space={2}>
          <Text size={1} weight="medium">
            Preview
          </Text>
          <Flex align="center" gap={2}>
            <UrlPreview style={{ flex: 1 }}>
              <Flex align="center" gap={1}>
                <LinkIcon style={{ flexShrink: 0 }} />
                <span>{fullUrl}</span>
              </Flex>
            </UrlPreview>
            <CopyButton
              icon={CopyIcon}
              onClick={handleCopyUrl}
              title="Copy URL"
              mode="ghost"
              padding={2}
            />
          </Flex>
        </Stack>
      )}

      {/* Path Editor */}
      <Stack space={2}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="medium">
            URL Path
          </Text>
          <Flex gap={2}>
            {slugFormatErrors.length > 0 && (
              <Button
                text="Clean Up"
                onClick={handleCleanUp}
                disabled={readOnly}
                mode="ghost"
                tone="positive"
                fontSize={1}
              />
            )}
            <GenerateButton
              icon={GenerateIcon}
              text="Generate"
              onClick={handleGenerate}
              disabled={!document?.title || readOnly}
              mode="ghost"
              tone="primary"
              fontSize={1}
            />
          </Flex>
        </Flex>

        {/* Visual Path Segments */}
        {segments.length > 0 && !isEditing && (
          <Flex align="center" gap={1} wrap="wrap">
            <Text size={1} muted>
              /
            </Text>
            {segments.map((segment, index) => (
              <Flex key={`${segment}-${index}`} align="center" gap={1}>
                <PathSegment padding={2} radius={2}>
                  <Text size={1} style={{ fontFamily: "monospace" }}>
                    {segment}
                  </Text>
                </PathSegment>
                {index < segments.length - 1 && (
                  <Text size={1} muted>
                    /
                  </Text>
                )}
              </Flex>
            ))}
          </Flex>
        )}

        {/* Input Field */}
        <Flex gap={2} align="center">
          <Box flex={1}>
            <SlugInput
              value={currentSlug}
              onChange={handleInputChange}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              placeholder="Enter URL path (e.g., about-us or blog/my-post)"
              disabled={readOnly}
            />
          </Box>
        </Flex>

        {/* Helper Text */}
        <Text size={1} muted>
          Must start with a forward slash (/). Use forward slashes to create
          nested paths. Only lowercase letters, numbers, hyphens, and slashes
          are allowed.
        </Text>
      </Stack>

      {/* Format Validation Errors */}
      {slugFormatErrors.length > 0 && (
        <Stack space={2}>
          {slugFormatErrors.map((error) => (
            <Badge key={error} tone="critical" padding={3} radius={2}>
              <Flex gap={2} align="center">
                <WarningOutlineIcon />
                <Text size={1}>{error}</Text>
              </Flex>
            </Badge>
          ))}
        </Stack>
      )}

      {/* Sanity Validation Error */}
      {slugValidationError && (
        <Badge tone="critical" padding={3} radius={2}>
          <Flex gap={2} align="center">
            <WarningOutlineIcon />
            <Text size={1}>{slugValidationError.message}</Text>
          </Flex>
        </Badge>
      )}
    </Stack>
  );
}
