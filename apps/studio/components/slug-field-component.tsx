import { CopyIcon, LinkIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
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
  cleanSlug,
  validateSlug,
  validateSlugForDocumentType,
} from "../utils/slug-validation";
import { ErrorStates } from "./url-slug/error-states";

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
    if (!currentSlug) return;

    const cleanValue = cleanSlug(currentSlug);
    handleChange(cleanValue);
  }, [currentSlug, handleChange]);

  const localizedPathname = getDocumentPath({
    ...document,
    slug: currentSlug,
  });

  const fullUrl = `${presentationOriginUrl ?? ""}${localizedPathname}`;

  // Validation for final slug
  const finalSlugValidation = useMemo(() => {
    return validateSlug(currentSlug);
  }, [currentSlug]);

  // Validation for path segments
  const pathSegmentValidations = useMemo(() => {
    return segments.map((segment) => validateSlug(segment));
  }, [segments]);

  // Combine all errors and warnings
  const combinedValidation = useMemo(() => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Add final slug errors/warnings
    allErrors.push(...finalSlugValidation.errors);
    allWarnings.push(...finalSlugValidation.warnings);
    // Add path segment errors/warnings
    pathSegmentValidations.forEach((validation, index) => {
      if (validation.errors.length > 0) {
        allErrors.push(
          `Segment "${segments[index]}": ${validation.errors.join(", ")}`,
        );
      }
      if (validation.warnings.length > 0) {
        allWarnings.push(
          `Segment "${segments[index]}": ${validation.warnings.join(", ")}`,
        );
      }
    });

    // Add duplicate warnings

    return {
      errors: [...new Set(allErrors)], // Remove duplicates
      warnings: [...new Set(allWarnings)], // Remove duplicates
    };
  }, [finalSlugValidation, pathSegmentValidations, segments]);
  console.log(
    "🚀 ~ PathnameFieldComponent ~ combinedValidation:",
    combinedValidation,
  );

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
  }, [fullUrl]);

  return (
    <Stack space={3}>
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
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="medium">
            URL Path
          </Text>
        </Flex>
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
          <GenerateButton
            // icon={GenerateIcon}
            text="Generate"
            onClick={handleGenerate}
            disabled={!document?.title || readOnly}
            mode="ghost"
            tone="primary"
            fontSize={1}
          />
        </Flex>

        {/* Helper Text */}
        <Text size={1} muted>
          Must start with a forward slash (/). Use forward slashes to create
          nested paths. Only lowercase letters, numbers, hyphens, and slashes
          are allowed.
        </Text>
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
      </Stack>
      <ErrorStates
        errors={[
          ...combinedValidation.errors,
          ...slugFormatErrors,
          ...(slugValidationError ? [slugValidationError.message] : []),
        ]}
        warnings={combinedValidation.warnings}
      />
    </Stack>
  );
}
