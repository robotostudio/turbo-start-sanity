/**
 * Validation utilities for URL slug formatting
 */

export interface SlugValidationError {
  type: "required" | "format" | "characters" | "structure" | "prefix";
  message: string;
}

export interface SlugValidationOptions {
  documentType?: string;
  requiredPrefix?: string;
  allowedPrefixes?: string[];
  sanityDocumentType?: string; // Auto-configure based on Sanity document type
}

/**
 * Validates a slug string and returns array of validation errors
 */
function validateBasicStructure(slug: string): SlugValidationError[] {
  const errors: SlugValidationError[] = [];

  // Check if it starts with /
  if (!slug.startsWith("/")) {
    errors.push({
      type: "structure",
      message: "URL path must start with a forward slash (/)",
    });
  }

  // Check for double slashes
  if (slug.includes("//")) {
    errors.push({
      type: "structure",
      message: "Multiple consecutive slashes (//) are not allowed",
    });
  }

  // Check for trailing slashes
  if (slug.endsWith("/") && slug !== "/") {
    errors.push({
      type: "structure",
      message: "Trailing slashes are not recommended",
    });
  }

  return errors;
}

function validateCharacters(slug: string): SlugValidationError[] {
  const errors: SlugValidationError[] = [];

  // Check for invalid characters
  const invalidChars = slug.match(/[^a-z0-9\-/\s]/gi);
  if (invalidChars) {
    const uniqueChars = [...new Set(invalidChars)].join(", ");
    errors.push({
      type: "characters",
      message: `Invalid characters found: ${uniqueChars}`,
    });
  }

  return errors;
}

function validateFormat(slug: string): SlugValidationError[] {
  const errors: SlugValidationError[] = [];

  // Check for spaces
  if (slug.includes(" ")) {
    errors.push({
      type: "format",
      message:
        "Spaces should be replaced with hyphens (-) for SEO-friendly URLs",
    });
  }

  // Check for uppercase letters
  if (slug !== slug.toLowerCase()) {
    errors.push({
      type: "format",
      message: "URLs should be lowercase for consistency",
    });
  }

  return errors;
}

function getDocumentTypeConfig(
  sanityDocumentType: string,
): SlugValidationOptions {
  switch (sanityDocumentType) {
    case "blog":
      return {
        documentType: "Blog post",
        requiredPrefix: "/blog/",
      };
    case "blogIndex":
      return {
        documentType: "Blog index",
        requiredPrefix: "/blog",
      };
    case "homePage":
      return {
        documentType: "Home page",
        requiredPrefix: "/",
      };
    case "page":
      return {
        documentType: "Page",
      };
    default:
      return {};
  }
}

function validatePrefixes(
  slug: string,
  options: SlugValidationOptions,
): SlugValidationError[] {
  const errors: SlugValidationError[] = [];
  const { documentType, requiredPrefix, allowedPrefixes, sanityDocumentType } =
    options;

  // Type-specific prefix validation
  if (documentType && requiredPrefix) {
    if (!slug.startsWith(requiredPrefix)) {
      errors.push({
        type: "prefix",
        message: `${documentType} URLs must start with "${requiredPrefix}"`,
      });
    }
  }

  // Check against allowed prefixes if specified
  if (allowedPrefixes && allowedPrefixes.length > 0) {
    const hasValidPrefix = allowedPrefixes.some((prefix) =>
      slug.startsWith(prefix),
    );
    if (!hasValidPrefix) {
      const prefixList = allowedPrefixes.join('", "');
      errors.push({
        type: "prefix",
        message: `URL must start with one of: "${prefixList}"`,
      });
    }
  }

  // Special validation for pages - prevent blog prefix usage
  if (sanityDocumentType === "page" && slug.startsWith("/blog")) {
    errors.push({
      type: "prefix",
      message:
        'Pages cannot use "/blog" prefix - this is reserved for blog content',
    });
  }

  return errors;
}

export function validateSlug(
  slug: string | undefined | null,
  options: SlugValidationOptions = {},
): SlugValidationError[] {
  if (!slug) {
    return [
      {
        type: "required",
        message: "URL path is required",
      },
    ];
  }

  // Auto-configure options based on Sanity document type if provided
  const finalOptions = options.sanityDocumentType
    ? { ...getDocumentTypeConfig(options.sanityDocumentType), ...options }
    : options;

  return [
    ...validateBasicStructure(slug),
    ...validateCharacters(slug),
    ...validateFormat(slug),
    ...validatePrefixes(slug, finalOptions),
  ];
}

/**
 * Validates a Sanity slug object and returns validation result
 * For use in Sanity schema validation
 */
export function validateSanitySlug(
  slug: { current?: string } | undefined,
  options: SlugValidationOptions = {},
): string | true {
  const errors = validateSlug(slug?.current, options);
  return errors.length > 0
    ? errors.map((error) => error.message).join("; ")
    : true;
}

/**
 * Helper function to create type-specific validators
 */
export function createSlugValidator(
  options: SlugValidationOptions,
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => validateSanitySlug(slug, options);
}

/**
 * Validates slug with auto-configured document type options
 * For use in components where you have the Sanity document type
 */
export function validateSlugForDocumentType(
  slug: string | undefined | null,
  sanityDocumentType: string,
): string[] {
  const errors = validateSlug(slug, { sanityDocumentType });
  return errors.map((error) => error.message);
}

/**
 * Cleans a slug string to make it valid
 */
export function cleanSlug(slug: string, sanityDocumentType?: string): string {
  if (!slug) return "/";

  let cleaned = slug
    // Convert to lowercase for consistency
    .toLowerCase()
    // Replace multiple slashes with single slash
    .replace(/\/+/g, "/")
    // Replace spaces with hyphens for SEO-friendly URLs
    .replace(/\s+/g, "-")
    // Remove invalid characters but keep slashes and hyphens
    .replace(/[^a-z0-9\-/]/g, "")
    // Clean up multiple hyphens
    .replace(/-+/g, "-")
    // Remove trailing slashes (except for root)
    .replace(/\/+$/, "")
    // Ensure it starts with a slash if not empty
    .replace(/^(?!\/)(.+)/, "/$1")
    // Clean up any remaining edge cases
    .replace(/\/-+/g, "/") // Remove hyphens after slashes
    .replace(/-+\//g, "/"); // Remove hyphens before slashes

  // Apply document-type specific rules
  if (sanityDocumentType) {
    cleaned = applyDocumentTypeRules(cleaned, sanityDocumentType);
  }

  return cleaned;
}

/**
 * Applies document-type specific cleaning rules
 */
function applyDocumentTypeRules(
  slug: string,
  sanityDocumentType: string,
): string {
  switch (sanityDocumentType) {
    case "blog":
      // Ensure blog posts start with /blog/
      if (!slug.startsWith("/blog/")) {
        if (slug === "/" || slug === "/blog") {
          return "/blog/untitled";
        }
        // Remove any existing prefix and add /blog/
        const cleanPath = slug.replace(/^\/+/, "");
        return `/blog/${cleanPath}`;
      }
      return slug;

    case "blogIndex":
      // Blog index should be exactly /blog
      if (slug !== "/blog") {
        return "/blog";
      }
      return slug;

    case "homePage":
      // Home page should be exactly /
      return "/";

    case "page":
      // Pages cannot use /blog prefix
      if (slug.startsWith("/blog")) {
        // Remove /blog prefix and clean up
        const withoutBlogPrefix = slug.replace(/^\/blog\/?/, "");
        if (!withoutBlogPrefix) {
          return "/page";
        }
        return `/${withoutBlogPrefix}`;
      }
      return slug;

    default:
      return slug;
  }
}

/**
 * Enhanced clean function that validates and provides suggestions
 */
export function cleanSlugWithValidation(
  slug: string,
  sanityDocumentType?: string,
): {
  cleanedSlug: string;
  wasChanged: boolean;
  changes: string[];
} {
  const original = slug;
  const changes: string[] = [];

  if (!slug) {
    return {
      cleanedSlug: "/",
      wasChanged: true,
      changes: ["Added default '/' path"],
    };
  }

  let cleaned = slug;

  // Track changes
  if (cleaned !== cleaned.toLowerCase()) {
    changes.push("Converted to lowercase");
    cleaned = cleaned.toLowerCase();
  }

  if (cleaned.includes("  ") || cleaned.includes(" ")) {
    changes.push("Replaced spaces with hyphens");
    cleaned = cleaned.replace(/\s+/g, "-");
  }

  if (cleaned.includes("//")) {
    changes.push("Fixed multiple consecutive slashes");
    cleaned = cleaned.replace(/\/+/g, "/");
  }

  const invalidCharRegex = /[^a-z0-9\-/]/;
  if (invalidCharRegex.exec(cleaned)) {
    changes.push("Removed invalid characters");
    cleaned = cleaned.replace(/[^a-z0-9\-/]/g, "");
  }

  if (cleaned.includes("--")) {
    changes.push("Fixed multiple consecutive hyphens");
    cleaned = cleaned.replace(/-+/g, "-");
  }

  if (cleaned.endsWith("/") && cleaned !== "/") {
    changes.push("Removed trailing slash");
    cleaned = cleaned.replace(/\/+$/, "");
  }

  if (!cleaned.startsWith("/") && cleaned) {
    changes.push("Added leading slash");
    cleaned = `/${cleaned}`;
  }

  // Apply document type rules
  if (sanityDocumentType) {
    const beforeTypeRules = cleaned;
    cleaned = applyDocumentTypeRules(cleaned, sanityDocumentType);
    if (beforeTypeRules !== cleaned) {
      changes.push(`Applied ${sanityDocumentType} type rules`);
    }
  }

  return {
    cleanedSlug: cleaned,
    wasChanged: original !== cleaned,
    changes,
  };
}
