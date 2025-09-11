/**
 * Centralized validation utilities for URL slug formatting
 * This is the single source of truth for all slug validation logic
 */

export interface SlugValidationResult {
  errors: string[];
  warnings: string[];
}

export interface SlugValidationOptions {
  documentType?: string;
  requireSlash?: boolean;
  requiredPrefix?: string;
  sanityDocumentType?: string; // Auto-configure based on Sanity document type
}

/**
 * Classification of validation issues
 */
export enum ValidationSeverity {
  ERROR = "error",
  WARNING = "warning",
}

export enum ValidationCategory {
  REQUIRED = "required",
  FORMAT = "format",
  LENGTH = "length",
  STRUCTURE = "structure",
  DOCUMENT_TYPE = "document_type",
  UNIQUENESS = "uniqueness",
}

export interface ValidationIssue {
  message: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  code: string;
}

// Centralized error messages - single source of truth
export const SLUG_ERROR_MESSAGES = {
  REQUIRED: "Slug is required.",
  INVALID_CHARACTERS:
    "Only lowercase letters, numbers, and hyphens are allowed.",
  INVALID_START_END: "Slug can't start or end with a hyphen.",
  CONSECUTIVE_HYPHENS: "Use only one hyphen between words.",
  NO_SPACES: "No spaces. Use hyphens instead.",
  NO_UNDERSCORES: "Underscores aren't allowed. Use hyphens instead.",
  MULTIPLE_SLASHES: "Multiple consecutive slashes (//) are not allowed.",
  MISSING_LEADING_SLASH: "URL path must start with a forward slash (/)",
  TRAILING_SLASH: "URL path must not end with a forward slash (/)",
} as const;

export const SLUG_WARNING_MESSAGES = {
  TOO_SHORT: "Slug must be at least 3 characters long.",
  TOO_LONG: "Slug can't be longer than 60 characters.",
  ALREADY_EXISTS: "This slug is already in use. Try another.",
} as const;

/**
 * Gets document-type specific configuration
 */
function getDocumentTypeConfig(
  sanityDocumentType: string,
): SlugValidationOptions {
  switch (sanityDocumentType) {
    case "blog":
      return {
        documentType: "Blog post",
        requiredPrefix: "/blog/",
        requireSlash: true,
      };
    case "blogIndex":
      return {
        documentType: "Blog index",
        requiredPrefix: "/blog",
        requireSlash: true,
      };
    case "homePage":
      return {
        documentType: "Home page",
        requiredPrefix: "/",
        requireSlash: true,
      };
    case "page":
      return {
        documentType: "Page",
        requireSlash: true,
      };
    default:
      return {
        requireSlash: true,
      };
  }
}

/**
 * Core validation rules for a single slug segment
 * This is the fundamental validation logic used throughout the application
 */
function validateSlugSegment(slug: string): SlugValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required check - critical error
  if (!slug.trim()) {
    errors.push(SLUG_ERROR_MESSAGES.REQUIRED);
    return { errors, warnings };
  }

  // Format validation - critical errors
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push(SLUG_ERROR_MESSAGES.INVALID_CHARACTERS);
  }

  if (slug.includes(" ")) {
    errors.push(SLUG_ERROR_MESSAGES.NO_SPACES);
  }

  if (slug.includes("_")) {
    errors.push(SLUG_ERROR_MESSAGES.NO_UNDERSCORES);
  }

  if (slug.startsWith("-") || slug.endsWith("-")) {
    errors.push(SLUG_ERROR_MESSAGES.INVALID_START_END);
  }

  if (slug.includes("--")) {
    errors.push(SLUG_ERROR_MESSAGES.CONSECUTIVE_HYPHENS);
  }

  // Length validation - warnings (non-blocking)
  if (slug.length < 3) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_SHORT);
  }

  if (slug.length > 60) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_LONG);
  }

  return { errors, warnings };
}

/**
 * Validates a full slug path (with slashes)
 */
export function validateSlug(
  slug: string | undefined | null,
  options: SlugValidationOptions = {},
): SlugValidationResult {
  if (!slug) {
    return {
      errors: [SLUG_ERROR_MESSAGES.REQUIRED],
      warnings: [],
    };
  }

  // Auto-configure options based on Sanity document type if provided
  const finalOptions = options.sanityDocumentType
    ? { ...getDocumentTypeConfig(options.sanityDocumentType), ...options }
    : options;

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Handle full paths with slashes
  if (slug.includes("/")) {
    const segments = slug.split("/").filter(Boolean);

    // Validate each segment
    // segments.forEach((segment, index) => {
    //   const segmentValidation = validateSlugSegment(segment);
    //   if (segmentValidation.errors.length > 0) {
    //     allErrors.push(
    //       `Segment "${segment}": ${segmentValidation.errors.join(", ")}`,
    //     );
    //   }
    //   if (segmentValidation.warnings.length > 0) {
    //     allWarnings.push(
    //       `Segment "${segment}": ${segmentValidation.warnings.join(", ")}`,
    //     );
    //   }
    // });

    // Additional path-specific validations - critical errors
    if (finalOptions.requireSlash && !slug.startsWith("/")) {
      allErrors.push(SLUG_ERROR_MESSAGES.MISSING_LEADING_SLASH);
    }
    if (finalOptions.sanityDocumentType !== "homePage" && slug.endsWith("/")) {
      allErrors.push(SLUG_ERROR_MESSAGES.TRAILING_SLASH);
    }

    if (slug.includes("//")) {
      allErrors.push(SLUG_ERROR_MESSAGES.MULTIPLE_SLASHES);
    }

    // Prefix validation
    if (finalOptions.requiredPrefix && finalOptions.documentType) {
      if (!slug.startsWith(finalOptions.requiredPrefix)) {
        allErrors.push(
          `${finalOptions.documentType} URLs must start with "${finalOptions.requiredPrefix}"`,
        );
      }
    }

    // Special validation for pages - prevent blog prefix usage
    if (
      finalOptions.sanityDocumentType === "page" &&
      slug.startsWith("/blog")
    ) {
      allErrors.push(
        'Pages cannot use "/blog" prefix - this is reserved for blog content',
      );
    }
  } else {
    // Single segment validation
    const segmentValidation = validateSlugSegment(slug);
    allErrors.push(...segmentValidation.errors);
    allWarnings.push(...segmentValidation.warnings);
  }

  return {
    errors: [...new Set(allErrors)],
    warnings: [...new Set(allWarnings)],
  };
}

/**
 * Validates a Sanity slug object and returns validation result
 * For use in Sanity schema validation
 */
export function validateSanitySlug(
  slug: { current?: string } | undefined,
  options: SlugValidationOptions = {},
): string | true {
  const validation = validateSlug(slug?.current, options);
  const allMessages = [...validation.errors, ...validation.warnings];
  return allMessages.length > 0 ? allMessages.join("; ") : true;
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
 * Helper function to create validators based on Sanity document type
 * More convenient for common document types
 */
export function createDocumentTypeValidator(
  sanityDocumentType: string,
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => validateSanitySlug(slug, { sanityDocumentType });
}

/**
 * Validates slug with auto-configured document type options
 * For use in components where you have the Sanity document type
 */
export function validateSlugForDocumentType(
  slug: string | undefined | null,
  sanityDocumentType: string,
): string[] {
  const validation = validateSlug(slug, { sanityDocumentType });
  return [...validation.errors, ...validation.warnings];
}

/**
 * Cleans a slug string to make it valid (matches transformSlug from use-slug.tsx)
 */
export function cleanSlug(slug: string): string {
  if (!slug) return "";

  return slug
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Cleans a full slug path
 */
export function cleanSlugPath(slug: string): string {
  if (!slug) return "/";

  let cleaned = slug
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9\-/]/g, "") // Keep only valid characters and slashes
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/\/+/g, "/") // Replace multiple slashes with single
    .replace(/\/-+/g, "/") // Remove hyphens after slashes
    .replace(/-+\//g, "/"); // Remove hyphens before slashes

  // Ensure it starts with / if not empty
  if (cleaned && !cleaned.startsWith("/")) {
    cleaned = `/${cleaned}`;
  }

  // Remove trailing slash unless it's root
  if (cleaned.endsWith("/") && cleaned !== "/") {
    cleaned = cleaned.replace(/\/+$/, "");
  }

  return cleaned || "/";
}

/**
 * Comprehensive validation function that returns structured validation results
 * This is the preferred validation function for components
 */
export function validateSlugComprehensive(
  slug: string | undefined | null,
  options: SlugValidationOptions = {},
): {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  validation: SlugValidationResult;
  segments: string[];
  segmentValidations: SlugValidationResult[];
} {
  const validation = validateSlug(slug, options);
  const segments = slug ? slug.split("/").filter(Boolean) : [];
  const segmentValidations = segments.map((segment) =>
    validateSlugSegment(segment),
  );

  return {
    isValid: validation.errors.length === 0,
    hasErrors: validation.errors.length > 0,
    hasWarnings: validation.warnings.length > 0,
    validation,
    segments,
    segmentValidations,
  };
}

/**
 * Enhanced clean function that provides change tracking
 */
export function cleanSlugWithValidation(slug: string): {
  cleanedSlug: string;
  wasChanged: boolean;
  changes: string[];
} {
  const original = slug;
  const changes: string[] = [];

  if (!slug) {
    return {
      cleanedSlug: "",
      wasChanged: true,
      changes: ["Added empty slug"],
    };
  }

  let cleaned = slug;

  // Track changes
  if (cleaned !== cleaned.toLowerCase()) {
    changes.push("Converted to lowercase");
    cleaned = cleaned.toLowerCase();
  }

  if (cleaned.includes(" ")) {
    changes.push("Replaced spaces with hyphens");
    cleaned = cleaned.replace(/\s+/g, "-");
  }

  const invalidCharRegex = /[^a-z0-9-]/;
  if (invalidCharRegex.test(cleaned)) {
    changes.push("Removed invalid characters");
    cleaned = cleaned.replace(/[^a-z0-9-]/g, "");
  }

  if (cleaned.includes("--")) {
    changes.push("Fixed multiple consecutive hyphens");
    cleaned = cleaned.replace(/-+/g, "-");
  }

  if (cleaned.startsWith("-") || cleaned.endsWith("-")) {
    changes.push("Removed leading/trailing hyphens");
    cleaned = cleaned.replace(/^-+|-+$/g, "");
  }

  return {
    cleanedSlug: cleaned,
    wasChanged: original !== cleaned,
    changes,
  };
}
