import { useMemo } from "react";
import type { SanityDocument } from "sanity";
import { getPublishedId, useFormValue, useValidationStatus } from "sanity";

import {
  getDocumentTypeConfig,
  type SlugValidationResult,
  validateSlug,
} from "../utils/slug-validation";

// Helper function to extract Sanity validation errors
function extractSanityValidationErrors(
  validation: ReturnType<typeof useValidationStatus>["validation"],
  includeSanityValidation: boolean
): string[] {
  if (!includeSanityValidation) {
    return [];
  }

  return validation
    .filter(
      (v) =>
        (v?.path.includes("current") || v?.path.includes("slug")) && v.message
    )
    .map((v) => v.message);
}

// Helper function to parse slug into segments
function parseSlugSegments(slug: string | undefined | null): string[] {
  if (!slug) {
    return [];
  }
  return slug.split("/").filter(Boolean);
}

// Helper function to validate individual segments
function validateSegments(segments: string[]): SlugValidationResult[] {
  return segments.map((segment) => validateSlug(segment));
}

export type UseSlugValidationOptions = {
  /**
   * The current slug value to validate
   */
  slug: string | undefined | null;

  /**
   * Whether to include document-type specific validation
   * If not provided, will use document type from form context
   */
  documentType?: string;

  /**
   * Whether to include Sanity validation status errors
   * @default true
   */
  includeSanityValidation?: boolean;
};

export type UseSlugValidationResult = {
  /**
   * Combined validation result with all errors and warnings
   */
  validation: SlugValidationResult;

  /**
   * Validation for individual path segments
   */
  segmentValidations: SlugValidationResult[];

  /**
   * Validation for the full path structure
   */
  pathValidation: SlugValidationResult;

  /**
   * Document type specific validation errors
   */
  documentTypeErrors: string[];

  /**
   * Sanity validation errors (from schema rules)
   */
  sanityValidationErrors: string[];

  /**
   * All errors combined and deduplicated
   */
  allErrors: string[];

  /**
   * All warnings combined and deduplicated
   */
  allWarnings: string[];

  /**
   * Whether the slug has any validation issues
   */
  hasValidationIssues: boolean;

  /**
   * Whether the slug has critical errors (blocking)
   */
  hasCriticalErrors: boolean;
};

/**
 * Optimized slug validation hook using unified config system
 * Single source of truth for all slug validation logic
 */
export function useSlugValidation(
  options: UseSlugValidationOptions
): UseSlugValidationResult {
  const {
    slug,
    documentType: providedDocumentType,
    includeSanityValidation = true,
  } = options;

  // Get document context
  const document = useFormValue([]) as SanityDocument;
  const documentType = providedDocumentType || document?._type;

  // Get document type configuration (single source of truth)
  const documentConfig = useMemo(
    () => (documentType ? getDocumentTypeConfig(documentType) : {}),
    [documentType]
  );

  // Get Sanity validation status
  const publishedId = useMemo(
    () => (document?._id ? getPublishedId(document._id) : ""),
    [document?._id]
  );

  const sanityValidation = useValidationStatus(
    publishedId || "",
    document?._type
  );

  // Extract Sanity slug validation errors
  const sanityValidationErrors = useMemo(
    () =>
      extractSanityValidationErrors(
        sanityValidation.validation,
        includeSanityValidation
      ),
    [sanityValidation.validation, includeSanityValidation]
  );

  // Unified validation using config-driven approach
  const validation = useMemo(() => {
    if (!slug) {
      return { errors: [], warnings: [] };
    }

    // Use unified validation with document type config
    return validateSlug(slug, documentConfig);
  }, [slug, documentConfig]);

  // Parse segments for detailed reporting
  const segments = useMemo(() => parseSlugSegments(slug), [slug]);

  // Individual segment validations for detailed error reporting
  const segmentValidations = useMemo(
    () => validateSegments(segments),
    [segments]
  );

  // Combine all validation results
  const combinedValidation = useMemo((): SlugValidationResult => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Add unified validation results
    allErrors.push(...validation.errors);
    allWarnings.push(...validation.warnings);

    // Add Sanity validation errors
    allErrors.push(...sanityValidationErrors);

    // Deduplicate
    const errorSet = new Set(allErrors);
    const uniqueWarnings = Array.from(new Set(allWarnings)).filter(
      (warning) => !errorSet.has(warning)
    );

    return {
      errors: Array.from(errorSet),
      warnings: uniqueWarnings,
    };
  }, [validation, sanityValidationErrors]);

  // Derived state
  const derivedState = useMemo(
    () => ({
      hasValidationIssues:
        combinedValidation.errors.length > 0 ||
        combinedValidation.warnings.length > 0,
      hasCriticalErrors: combinedValidation.errors.length > 0,
    }),
    [combinedValidation]
  );

  return {
    validation: combinedValidation,
    segmentValidations,
    pathValidation: validation, // Unified validation result
    documentTypeErrors: validation.errors, // Now part of unified validation
    sanityValidationErrors,
    allErrors: combinedValidation.errors,
    allWarnings: combinedValidation.warnings,
    hasValidationIssues: derivedState.hasValidationIssues,
    hasCriticalErrors: derivedState.hasCriticalErrors,
  };
}

/**
 * Simplified validation hook for basic use cases
 */
export function useBasicSlugValidation(slug: string | undefined | null): {
  errors: string[];
  warnings: string[];
  isValid: boolean;
} {
  const { allErrors, allWarnings, hasCriticalErrors } = useSlugValidation({
    slug,
    includeSanityValidation: false,
  });

  return {
    errors: allErrors,
    warnings: allWarnings,
    isValid: !hasCriticalErrors,
  };
}
