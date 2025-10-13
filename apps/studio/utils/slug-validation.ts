/**
 * Centralized validation utilities for URL slug formatting
 * This is the single source of truth for all slug validation logic
 */

export type SlugValidationResult = {
  errors: string[];
  warnings: string[];
};

export type SlugValidationOptions = {
  documentType?: string;
  requireSlash?: boolean;
  requiredPrefix?: string;
  sanityDocumentType?: string;
  segmentCount?: number;
  allowedPatterns?: RegExp[];
  forbiddenPatterns?: RegExp[];
  customValidators?: Array<(slug: string) => string[]>;
};

/**
 * Classification of validation issues
 */
export const ValidationSeverity = {
  ERROR: "error",
  WARNING: "warning",
} as const;
export type ValidationSeverity =
  (typeof ValidationSeverity)[keyof typeof ValidationSeverity];

export const ValidationCategory = {
  REQUIRED: "required",
  FORMAT: "format",
  LENGTH: "length",
  STRUCTURE: "structure",
  DOCUMENT_TYPE: "document_type",
  UNIQUENESS: "uniqueness",
} as const;
export type ValidationCategory =
  (typeof ValidationCategory)[keyof typeof ValidationCategory];

export type ValidationIssue = {
  message: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  code: string;
};

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

// Constants for validation
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 60;
const MIN_BLOG_SLUG_LENGTH = 3;
const VALID_SLUG_REGEX = /^[a-z0-9-]+$/;
const INVALID_CHAR_REGEX = /[^a-z0-9-]/;
const CLEAN_INVALID_CHARS_REGEX = /[^a-z0-9-]/g;
const FORBIDDEN_BLOG_PATTERN = /^\/blog\/.+/;
const FORBIDDEN_ADMIN_PATTERN = /^\/admin/;
const FORBIDDEN_API_PATTERN = /^\/api/;

export const SLUG_WARNING_MESSAGES = {
  TOO_SHORT: `Slug must be at least ${MIN_SLUG_LENGTH} characters long.`,
  TOO_LONG: `Slug can't be longer than ${MAX_SLUG_LENGTH} characters.`,
  ALREADY_EXISTS: "This slug is already in use. Try another.",
} as const;

// Document type validation rules - Single source of truth
const DOCUMENT_TYPE_CONFIGS: Record<string, SlugValidationOptions> = {
  author: {
    documentType: "Author",
    requiredPrefix: "/author/",
    requireSlash: true,
    segmentCount: 2,
    sanityDocumentType: "author",
    forbiddenPatterns: [/^\/blog/],
    customValidators: [
      (slug: string) => {
        if (slug.includes("/admin")) {
          return ["Author URLs cannot contain '/admin' path"];
        }
        return [];
      },
    ],
  },
  blog: {
    documentType: "Blog post",
    requiredPrefix: "/blog/",
    requireSlash: true,
    segmentCount: 2,
    sanityDocumentType: "blog",
    forbiddenPatterns: [/^\/author/, /^\/admin/],
    customValidators: [
      (slug: string) => {
        const segments = slug.split("/").filter(Boolean);
        if (
          segments.length === 2 &&
          segments[1].length < MIN_BLOG_SLUG_LENGTH
        ) {
          return ["Blog post slug must be at least 3 characters"];
        }
        return [];
      },
    ],
  },
  blogIndex: {
    documentType: "Blog index",
    requiredPrefix: "/blog",
    requireSlash: true,
    segmentCount: 1,
    sanityDocumentType: "blogIndex",
    forbiddenPatterns: [FORBIDDEN_BLOG_PATTERN],
    customValidators: [
      (slug: string) => {
        if (slug !== "/blog") {
          return ["Blog index must be exactly '/blog'"];
        }
        return [];
      },
    ],
  },
  homePage: {
    documentType: "Home page",
    sanityDocumentType: "homePage",
    requiredPrefix: "/",
    requireSlash: true,
    segmentCount: 0,
    customValidators: [
      (slug: string) => {
        if (slug !== "/") {
          return ["Home page must be exactly '/'"];
        }
        return [];
      },
    ],
  },
  page: {
    documentType: "Page",
    requireSlash: true,
    sanityDocumentType: "page",
    forbiddenPatterns: [
      /^\/blog/,
      /^\/author/,
      FORBIDDEN_ADMIN_PATTERN,
      FORBIDDEN_API_PATTERN,
    ],
    customValidators: [
      (slug: string) => {
        const errors: string[] = [];
        if (slug.startsWith("/blog")) {
          errors.push(
            'Pages cannot use "/blog" prefix - reserved for blog content'
          );
        }
        if (slug.startsWith("/author")) {
          errors.push(
            'Pages cannot use "/author" prefix - reserved for authors'
          );
        }
        if (slug.startsWith("/admin")) {
          errors.push('Pages cannot use "/admin" prefix - reserved for admin');
        }
        if (slug.startsWith("/api")) {
          errors.push(
            'Pages cannot use "/api" prefix - reserved for API routes'
          );
        }
        return errors;
      },
    ],
  },
};

/**
 * Gets comprehensive document-type specific configuration
 * This is the single source of truth for all slug validation rules
 */
export function getDocumentTypeConfig(
  sanityDocumentType: string
): SlugValidationOptions {
  const config = DOCUMENT_TYPE_CONFIGS[sanityDocumentType];

  if (config) {
    return { ...config };
  }

  // Default configuration for unknown document types
  return {
    documentType: "Document",
    requireSlash: true,
    sanityDocumentType,
    forbiddenPatterns: [FORBIDDEN_ADMIN_PATTERN, FORBIDDEN_API_PATTERN],
    customValidators: [],
  };
}

/**
 * Validates if slug is empty or whitespace only
 */
function validateSlugRequired(slug: string): string[] {
  if (!slug.trim()) {
    return [SLUG_ERROR_MESSAGES.REQUIRED];
  }
  return [];
}

/**
 * Validates slug format and character restrictions
 */
function validateSlugFormat(slug: string): string[] {
  const errors: string[] = [];

  if (!VALID_SLUG_REGEX.test(slug)) {
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

  return errors;
}

/**
 * Validates slug length and returns warnings
 */
function validateSlugLength(slug: string): string[] {
  const warnings: string[] = [];

  if (slug.length < MIN_SLUG_LENGTH) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_SHORT);
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_LONG);
  }

  return warnings;
}

/**
 * Core validation rules for a single slug segment
 * This is the fundamental validation logic used throughout the application
 */
function validateSlugSegment(slug: string): SlugValidationResult {
  // Early return for empty slugs
  const requiredErrors = validateSlugRequired(slug);
  if (requiredErrors.length > 0) {
    return { errors: requiredErrors, warnings: [] };
  }

  // Validate format and length
  const formatErrors = validateSlugFormat(slug);
  const lengthWarnings = validateSlugLength(slug);

  return {
    errors: formatErrors,
    warnings: lengthWarnings,
  };
}

/**
 * Validates path structure (slashes, segments)
 */
function validatePathStructure(
  slug: string,
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];
  const segments = slug.split("/").filter(Boolean);

  // Segment count validation
  if (
    options.segmentCount !== undefined &&
    segments.length !== options.segmentCount
  ) {
    errors.push(
      `${options.documentType} URLs must have ${options.segmentCount} segments`
    );
  }

  // Leading slash validation
  if (options.requireSlash && !slug.startsWith("/")) {
    errors.push(SLUG_ERROR_MESSAGES.MISSING_LEADING_SLASH);
  }

  // Trailing slash validation (except for home page)
  if (options.sanityDocumentType !== "homePage" && slug.endsWith("/")) {
    errors.push(SLUG_ERROR_MESSAGES.TRAILING_SLASH);
  }

  // Multiple slashes validation
  if (slug.includes("//")) {
    errors.push(SLUG_ERROR_MESSAGES.MULTIPLE_SLASHES);
  }

  return errors;
}

/**
 * Validates required prefix for document types
 */
function validateRequiredPrefix(
  slug: string,
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];

  if (
    options.requiredPrefix &&
    options.documentType &&
    !slug.startsWith(options.requiredPrefix)
  ) {
    errors.push(
      `${options.documentType} URLs must start with "${options.requiredPrefix}"`
    );
  }

  return errors;
}

/**
 * Validates forbidden patterns based on document type config
 */
function validateForbiddenPatterns(
  slug: string,
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];

  if (options.forbiddenPatterns) {
    for (const pattern of options.forbiddenPatterns) {
      if (pattern.test(slug)) {
        errors.push(
          `URL pattern not allowed for ${options.documentType || "this document type"}`
        );
      }
    }
  }

  return errors;
}

/**
 * Validates using custom validators from document type config
 */
function validateCustomRules(
  slug: string,
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];

  if (options.customValidators) {
    for (const validator of options.customValidators) {
      errors.push(...validator(slug));
    }
  }

  return errors;
}

/**
 * Unified slug validation function using document type config as single source of truth
 */
export function validateSlug(
  slug: string | undefined | null,
  options: SlugValidationOptions = {}
): SlugValidationResult {
  if (!slug) {
    return {
      errors: [SLUG_ERROR_MESSAGES.REQUIRED],
      warnings: [],
    };
  }

  // Get comprehensive config from single source of truth
  const config = options.sanityDocumentType
    ? { ...getDocumentTypeConfig(options.sanityDocumentType), ...options }
    : { ...options };

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Handle full paths with slashes
  if (slug.includes("/")) {
    // Core path structure validation
    allErrors.push(...validatePathStructure(slug, config));

    // Required prefix validation
    allErrors.push(...validateRequiredPrefix(slug, config));

    // Forbidden patterns validation (from config)
    allErrors.push(...validateForbiddenPatterns(slug, config));

    // Custom validation rules (from config)
    allErrors.push(...validateCustomRules(slug, config));

    // Validate individual segments
    const segments = slug.split("/").filter(Boolean);
    for (const segment of segments) {
      const segmentValidation = validateSlugSegment(segment);
      allErrors.push(...segmentValidation.errors);
      allWarnings.push(...segmentValidation.warnings);
    }
  } else {
    // Single segment validation
    const segmentValidation = validateSlugSegment(slug);
    allErrors.push(...segmentValidation.errors);
    allWarnings.push(...segmentValidation.warnings);

    // Apply custom validators even for single segments
    allErrors.push(...validateCustomRules(slug, config));
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
  options: SlugValidationOptions = {}
): string | true {
  const validation = validateSlug(slug?.current, options);
  const allMessages = [...validation.errors, ...validation.warnings];
  return allMessages.length > 0 ? allMessages.join("; ") : true;
}

/**
 * Helper function to create type-specific validators
 */
export function createSlugValidator(
  options: SlugValidationOptions
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => validateSanitySlug(slug, options);
}

/**
 * Helper function to create validators based on Sanity document type
 * More convenient for common document types
 */
export function createDocumentTypeValidator(
  sanityDocumentType: string
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => validateSanitySlug(slug, { sanityDocumentType });
}

/**
 * Validates slug with auto-configured document type options
 * Simplified to use unified validation system
 */
export function validateSlugForDocumentType(
  slug: string | undefined | null,
  sanityDocumentType: string
): string[] {
  const validation = validateSlug(slug, { sanityDocumentType });
  return [...validation.errors, ...validation.warnings];
}

/**
 * Cleans a slug string to make it valid
 */
export function cleanSlug(slug: string): string {
  if (!slug) {
    return "";
  }

  return slug
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a slug from title using document type configuration
 */
export function generateSlugFromTitle(
  title: string,
  documentType: string,
  currentSlug?: string
): string {
  if (!title?.trim()) {
    return "";
  }

  const config = getDocumentTypeConfig(documentType);
  const cleanTitle = cleanSlug(title);

  if (!cleanTitle) {
    return "";
  }

  // Handle different document types with their specific requirements
  switch (documentType) {
    case "homePage":
      return "/";

    case "blogIndex":
      return "/blog";

    case "author":
      return `/author/${cleanTitle}`;

    case "blog":
      return `/blog/${cleanTitle}`;

    case "page":
      // For pages, preserve existing path structure if it exists
      if (currentSlug?.includes("/")) {
        const segments = currentSlug.split("/").filter(Boolean);
        if (segments.length > 1) {
          const basePath = segments.slice(0, -1).join("/");
          return `/${basePath}/${cleanTitle}`;
        }
      }
      return `/${cleanTitle}`;

    default:
      // Use required prefix if specified in config
      if (config.requiredPrefix) {
        return config.requiredPrefix.endsWith("/")
          ? `${config.requiredPrefix}${cleanTitle}`
          : `${config.requiredPrefix}/${cleanTitle}`;
      }
      return `/${cleanTitle}`;
  }
}

/**
 * Comprehensive validation function that returns structured validation results
 * This is the preferred validation function for components
 */
export function validateSlugComprehensive(
  slug: string | undefined | null,
  options: SlugValidationOptions = {}
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
    validateSlugSegment(segment)
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

  if (INVALID_CHAR_REGEX.test(cleaned)) {
    changes.push("Removed invalid characters");
    cleaned = cleaned.replace(CLEAN_INVALID_CHARS_REGEX, "");
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
