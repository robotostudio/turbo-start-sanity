/**
 * Slug validation — single source of truth for all URL path validation.
 */

// --- Types ---

export type SlugValidationResult = {
  errors: string[];
  warnings: string[];
};

export type SlugValidationOptions = {
  /** Human-readable doc type name for error messages */
  documentType?: string;
  /** Require leading slash */
  requireSlash?: boolean;
  /** Required URL prefix (e.g., "/blog/") */
  requiredPrefix?: string;
  /** Sanity document type key */
  sanityDocumentType?: string;
  /** Expected segment count */
  segmentCount?: number;
  /** Forbidden URL patterns */
  forbiddenPatterns?: RegExp[];
  /** Custom validators returning error strings */
  customValidators?: Array<(slug: string) => string[]>;
};

// --- Constants ---

const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_LEN = 3;
const MAX_LEN = 60;

export const SLUG_ERROR_MESSAGES = {
  REQUIRED: "Slug must have a value",
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
  TOO_SHORT: `Slug must be at least ${MIN_LEN} characters long.`,
  TOO_LONG: `Slug can't be longer than ${MAX_LEN} characters.`,
} as const;

// --- Document type configs ---

const CONFIGS: Record<string, SlugValidationOptions> = {
  blog: {
    documentType: "Blog post",
    requiredPrefix: "/blog/",
    requireSlash: true,
    segmentCount: 2,
    sanityDocumentType: "blog",
  },
  blogIndex: {
    documentType: "Blog index",
    requireSlash: true,
    sanityDocumentType: "blogIndex",
    customValidators: [
      (s) => (s !== "/blog" ? ["Blog index must be exactly '/blog'"] : []),
    ],
  },
  homePage: {
    documentType: "Home page",
    requireSlash: true,
    sanityDocumentType: "homePage",
    customValidators: [
      (s) => (s !== "/" ? ["Home page must be exactly '/'"] : []),
    ],
  },
  page: {
    documentType: "Page",
    requireSlash: true,
    sanityDocumentType: "page",
    customValidators: [
      (slug) => {
        const reserved = [
          ["/blog", "blog content"],
          ["/author", "authors"],
          ["/admin", "admin"],
          ["/api", "API routes"],
        ] as const;
        return reserved
          .filter(([prefix]) => slug.startsWith(prefix))
          .map(
            ([prefix, label]) =>
              `Pages cannot use "${prefix}" prefix - reserved for ${label}`
          );
      },
    ],
  },
};

// --- Core validation ---

/** Validate a single path segment (no slashes). */
function validateSegment(seg: string): SlugValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (seg.includes(" ")) {
    errors.push(SLUG_ERROR_MESSAGES.NO_SPACES);
  }
  if (seg.includes("_")) {
    errors.push(SLUG_ERROR_MESSAGES.NO_UNDERSCORES);
  }
  if (seg.startsWith("-") || seg.endsWith("-")) {
    errors.push(SLUG_ERROR_MESSAGES.INVALID_START_END);
  }
  if (seg.includes("--")) {
    errors.push(SLUG_ERROR_MESSAGES.CONSECUTIVE_HYPHENS);
  }
  if (!SEGMENT_RE.test(seg) && errors.length === 0) {
    errors.push(SLUG_ERROR_MESSAGES.INVALID_CHARACTERS);
  }

  if (seg.length < MIN_LEN) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_SHORT);
  }
  if (seg.length > MAX_LEN) {
    warnings.push(SLUG_WARNING_MESSAGES.TOO_LONG);
  }

  return { errors, warnings };
}

/** Validate path-level structure (slashes, segment count). */
function validatePathStructure(
  slug: string,
  segments: string[],
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];

  if (options.requireSlash && !slug.startsWith("/")) {
    errors.push(SLUG_ERROR_MESSAGES.MISSING_LEADING_SLASH);
  }
  if (slug.length > 1 && slug.endsWith("/")) {
    errors.push(SLUG_ERROR_MESSAGES.TRAILING_SLASH);
  }
  if (slug.includes("//")) {
    errors.push(SLUG_ERROR_MESSAGES.MULTIPLE_SLASHES);
  }

  if (
    options.segmentCount !== undefined &&
    segments.length !== options.segmentCount
  ) {
    errors.push(
      `${options.documentType ?? "Document"} URLs must have ${options.segmentCount} segments`
    );
  }

  return errors;
}

/** Validate doc-type-specific rules (prefix, patterns, custom). */
function validateDocTypeRules(
  slug: string,
  options: SlugValidationOptions
): string[] {
  const errors: string[] = [];
  const label = options.documentType ?? "this document type";

  if (options.requiredPrefix && !slug.startsWith(options.requiredPrefix)) {
    errors.push(
      `${options.documentType ?? "Document"} URLs must start with "${options.requiredPrefix}"`
    );
  }

  for (const pattern of options.forbiddenPatterns ?? []) {
    if (pattern.test(slug)) {
      errors.push(`URL pattern not allowed for ${label}`);
    }
  }

  for (const validator of options.customValidators ?? []) {
    errors.push(...validator(slug));
  }

  return errors;
}

/** Main validation — flat pipeline, no branching. */
export function validateSlug(
  slug: string | undefined | null,
  options: SlugValidationOptions = {}
): SlugValidationResult {
  if (!slug?.trim()) {
    return { errors: [SLUG_ERROR_MESSAGES.REQUIRED], warnings: [] };
  }

  const segments = slug.split("/").filter(Boolean);
  const errors: string[] = [
    ...validatePathStructure(slug, segments, options),
    ...validateDocTypeRules(slug, options),
  ];
  const warnings: string[] = [];

  for (const seg of segments) {
    const r = validateSegment(seg);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

// --- Public API for schema & components ---

/** Get validation config for a document type. */
export function getDocumentTypeConfig(docType: string): SlugValidationOptions {
  return CONFIGS[docType]
    ? { ...CONFIGS[docType] }
    : {
        documentType: "Document",
        requireSlash: true,
        sanityDocumentType: docType,
      };
}

/** Create a Sanity schema error validator from options. */
export function createSlugErrorValidator(
  options: SlugValidationOptions
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => {
    const { errors } = validateSlug(slug?.current, options);
    return errors.length > 0 ? errors.join("; ") : true;
  };
}

/** Create a Sanity schema warning validator from options. */
export function createSlugWarningValidator(
  options: SlugValidationOptions
): (slug: { current?: string } | undefined) => string | true {
  return (slug) => {
    const { warnings } = validateSlug(slug?.current, options);
    return warnings.length > 0 ? warnings.join("; ") : true;
  };
}

/** Clean a raw string into a valid slug segment. */
export function cleanSlug(slug: string): string {
  if (!slug) return "";
  return slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a slug from a document title using doc type conventions. */
export function generateSlugFromTitle(
  title: string,
  documentType: string,
  currentSlug?: string
): string {
  if (!title?.trim()) return "";

  const clean = cleanSlug(title);
  if (!clean) return "";

  switch (documentType) {
    case "homePage":
      return "/";
    case "blogIndex":
      return "/blog";
    case "author":
      return `/author/${clean}`;
    case "blog":
      return `/blog/${clean}`;
    case "page": {
      if (currentSlug?.includes("/")) {
        const segments = currentSlug.split("/").filter(Boolean);
        if (segments.length > 1)
          return `/${segments.slice(0, -1).join("/")}/${clean}`;
      }
      return `/${clean}`;
    }
    default: {
      const config = getDocumentTypeConfig(documentType);
      if (config.requiredPrefix) {
        return config.requiredPrefix.endsWith("/")
          ? `${config.requiredPrefix}${clean}`
          : `${config.requiredPrefix}/${clean}`;
      }
      return `/${clean}`;
    }
  }
}
