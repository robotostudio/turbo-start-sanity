import { CopyIcon } from "@sanity/icons";
import { Box, Button, Flex, Stack, Text, TextInput } from "@sanity/ui";
import type { ChangeEvent } from "react";
import { useCallback, useMemo } from "react";
import {
  type ObjectFieldProps,
  type SanityDocument,
  type SlugValue,
  set,
  unset,
  useFormValue,
} from "sanity";
import { styled } from "styled-components";
import { useSlugValidation } from "../hooks/use-slug-validation";
import { generateSlugFromTitle } from "../utils/slug-validation";
import { ErrorStates } from "./url-slug/error-states";

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;

// Styled components
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

// Types
type SlugInputProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
};

type GenerateButtonProps = {
  onGenerate: () => void;
  disabled?: boolean;
};

type UrlPreviewProps = {
  url: string;
  onCopy: () => void;
};

type FieldHeaderProps = {
  title?: string;
  description?: string;
};

// Focused sub-components
function FieldHeader({ title, description }: FieldHeaderProps) {
  if (!(title || description)) {
    return null;
  }

  return (
    <Stack space={2}>
      {title && (
        <Text size={1} weight="semibold">
          {title}
        </Text>
      )}
      {description && (
        <Text muted size={1}>
          {description}
        </Text>
      )}
    </Stack>
  );
}

function SlugInputField({
  value,
  onChange,
  readOnly,
  placeholder,
}: SlugInputProps) {
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <SlugInput
      disabled={readOnly}
      onChange={handleInputChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

function SlugGenerateButton({ onGenerate, disabled }: GenerateButtonProps) {
  return (
    <GenerateButton
      disabled={disabled}
      fontSize={1}
      mode="ghost"
      onClick={onGenerate}
      text="Generate"
      tone="primary"
    />
  );
}

function UrlPreviewSection({ url, onCopy }: UrlPreviewProps) {
  return (
    <Stack space={2}>
      <Text size={1} weight="medium">
        Preview
      </Text>
      <Flex align="center" gap={2}>
        <UrlPreview style={{ flex: 1 }}>
          <Flex align="center" gap={2}>
            <span>{url}</span>
          </Flex>
        </UrlPreview>
        <CopyButton
          icon={CopyIcon}
          mode="ghost"
          onClick={onCopy}
          padding={2}
          title="Copy URL"
        />
      </Flex>
    </Stack>
  );
}

function HelpText() {
  return (
    <Text muted size={1}>
      Must start with a forward slash (/). Use forward slashes to create nested
      paths. Only lowercase letters, numbers, hyphens, and slashes are allowed.
    </Text>
  );
}

export function PathnameFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
  } = props;

  // Get document context for title and path generation
  const document = useFormValue([]) as SanityDocument;
  const currentSlug = value?.current || "";

  // Use centralized validation hook with document type for unified config
  const { allErrors, allWarnings } = useSlugValidation({
    slug: currentSlug,
    documentType: document?._type,
    includeSanityValidation: true,
  });

  // Memoize computed values for performance
  const localizedPathname = useMemo(() => {
    try {
      // Simple path generation - just use the slug as the path
      return currentSlug.startsWith("/") ? currentSlug : `/${currentSlug}`;
    } catch {
      return currentSlug || "/";
    }
  }, [currentSlug]);

  const fullUrl = useMemo(
    () => `${presentationOriginUrl ?? ""}${localizedPathname}`,
    [localizedPathname]
  );

  // Event handlers with error handling
  const handleChange = useCallback(
    (newValue?: string) => {
      try {
        const patch =
          typeof newValue === "string"
            ? set({
                current: newValue,
                _type: "slug",
              })
            : unset();

        onChange(patch);
      } catch {
        // Silently handle errors - validation will show user-friendly messages
      }
    },
    [onChange]
  );

  const handleSlugChange = useCallback(
    (rawValue: string) => {
      // Allow users to type anything - don't clean while typing
      handleChange(rawValue);
    },
    [handleChange]
  );

  const handleGenerate = useCallback(() => {
    try {
      const documentTitle = document?.title as string | undefined;
      const documentType = document?._type;

      if (!(documentTitle?.trim() && documentType)) {
        return;
      }

      // Use unified slug generation with document type config
      const generatedSlug = generateSlugFromTitle(
        documentTitle,
        documentType,
        currentSlug
      );

      if (generatedSlug) {
        handleChange(generatedSlug);
      }
    } catch {
      // Silently handle errors
    }
  }, [document?.title, document?._type, currentSlug, handleChange]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      // Fallback for older browsers or when clipboard API fails
      try {
        const textArea = globalThis.document?.createElement("textarea");
        if (textArea && globalThis.document?.body) {
          textArea.value = fullUrl;
          globalThis.document.body.appendChild(textArea);
          textArea.select();
          globalThis.document.execCommand?.("copy");
          globalThis.document.body.removeChild(textArea);
        }
      } catch {
        // Silently handle fallback errors
      }
    }
  }, [fullUrl]);

  return (
    <Stack space={4}>
      <FieldHeader description={description} title={title} />

      <Stack space={4}>
        <Stack space={2}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">
              URL Path
            </Text>
          </Flex>

          <Flex align="center" gap={2}>
            <Box flex={1}>
              <SlugInputField
                onChange={handleSlugChange}
                placeholder="Enter URL path (e.g., about-us or blog/my-post)"
                readOnly={readOnly}
                value={currentSlug}
              />
            </Box>
            <SlugGenerateButton
              disabled={
                !(
                  typeof document?.title === "string" && document.title.trim()
                ) || readOnly
              }
              onGenerate={handleGenerate}
            />
          </Flex>
        </Stack>

        <HelpText />

        {currentSlug && (
          <UrlPreviewSection onCopy={handleCopyUrl} url={fullUrl} />
        )}
      </Stack>

      <ErrorStates errors={allErrors} warnings={allWarnings} />
    </Stack>
  );
}
