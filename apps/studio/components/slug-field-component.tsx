import { CopyIcon } from "@sanity/icons";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import type { ChangeEvent } from "react";
import { useCallback } from "react";
import {
  type ObjectFieldProps,
  type SanityDocument,
  set,
  type SlugValue,
  unset,
  useFormValue,
} from "sanity";
import slugify from "slugify";
import { styled } from "styled-components";

import { getDocumentPath } from "../utils/helper";
// import { cleanSlug } from "../utils/slug-validation";
import { ErrorStates } from "./url-slug/error-states";
import { useSlugValidation } from "./url-slug/use-slug-validation";

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
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
  } = props;

  // const [isEditing, setIsEditing] = useState(false);

  // Get document context for title and path generation
  const document = useFormValue([]) as SanityDocument;
  const currentSlug = value?.current || "";

  // Use centralized validation hook - single source of truth
  const { allErrors, allWarnings } = useSlugValidation({
    slug: currentSlug,
    includeSanityValidation: true,
  });

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

    const segments = currentSlug.split("/").filter(Boolean);
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
  }, [document?.title, currentSlug, handleChange]);

  // const handleCleanUp = useCallback(() => {
  //   if (!currentSlug) return;
  //   const cleanValue = cleanSlug(currentSlug);
  //   handleChange(cleanValue);
  // }, [currentSlug, handleChange]);

  const localizedPathname = getDocumentPath({
    ...document,
    slug: currentSlug,
  });

  const fullUrl = `${presentationOriginUrl ?? ""}${localizedPathname}`;

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
  }, [fullUrl]);

  return (
    <Stack space={4}>
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
      <Stack space={4}>
        <Stack space={2}>
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
                // onFocus={() => setIsEditing(true)}
                // onBlur={() => setIsEditing(false)}
                placeholder="Enter URL path (e.g., about-us or blog/my-post)"
                disabled={readOnly}
              />
            </Box>
            <GenerateButton
              text="Generate"
              onClick={handleGenerate}
              disabled={!document?.title || readOnly}
              mode="ghost"
              tone="primary"
              fontSize={1}
            />
          </Flex>
        </Stack>

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
                <Flex align="center" gap={2}>
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

      <ErrorStates errors={allErrors} warnings={allWarnings} />
    </Stack>
  );
}
