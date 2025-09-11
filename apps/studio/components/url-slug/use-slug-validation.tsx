import { useMemo } from "react";
import type { SanityDocument } from "sanity";
import { getPublishedId, useFormValue, useValidationStatus } from "sanity";

import {
  type SlugValidationResult,
  validateSlug,
  validateSlugForDocumentType,
} from "../../utils/slug-validation";

export interface UseSlugValidationOptions {
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
}

export interface UseSlugValidationResult {
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
}

/**
 * Centralized slug validation hook that serves as the single source of truth
 * for all slug validation logic across the application
 */
export function useSlugValidation(
  options: UseSlugValidationOptions,
): UseSlugValidationResult {
  const {
    slug,
    documentType: providedDocumentType,
    includeSanityValidation = true,
  } = options;

  // Get document context
  const document = useFormValue([]) as SanityDocument;
  const documentType = providedDocumentType || document?._type;

  // Get Sanity validation status
  const publishedId = getPublishedId(document?._id);
  const sanityValidation = useValidationStatus(publishedId, document?._type);

  // Extract Sanity slug validation errors
  const sanityValidationErrors = useMemo(() => {
    if (!includeSanityValidation) return [];

    return sanityValidation.validation
      .filter(
        (v) =>
          (v?.path.includes("current") || v?.path.includes("slug")) &&
          v.message,
      )
      .map((v) => v.message);
  }, [sanityValidation.validation, includeSanityValidation]);

  // Parse slug into segments
  const segments = useMemo(() => {
    if (!slug) return [];
    return slug.split("/").filter(Boolean);
  }, [slug]);

  // Validate individual segments
  const segmentValidations = useMemo(() => {
    return segments.map((segment) => validateSlug(segment));
  }, [segments]);

  // Validate full path structure
  const pathValidation = useMemo(() => {
    return validateSlug(slug, { sanityDocumentType: documentType });
  }, [slug, documentType]);

  // Document type specific validation
  const documentTypeErrors = useMemo(() => {
    if (!documentType || !slug) return [];
    return validateSlugForDocumentType(slug, documentType);
  }, [slug, documentType]);

  // Combine all validation results
  const combinedValidation = useMemo((): SlugValidationResult => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Add path validation errors/warnings
    allErrors.push(...pathValidation.errors);
    allWarnings.push(...pathValidation.warnings);

    // // Add segment validation errors/warnings with context
    segmentValidations.forEach((validation, index) => {
      const segment = segments[index];
      if (validation.errors.length > 0) {
        allErrors.push(
          ...validation.errors.map((error) => `Segment "${segment}": ${error}`),
        );
      }
      if (validation.warnings.length > 0) {
        allWarnings.push(
          ...validation.warnings.map(
            (warning) => `Segment "${segment}": ${warning}`,
          ),
        );
      }
    });

    allErrors.push(...documentTypeErrors);
    allErrors.push(...sanityValidationErrors);
    const errorSet = new Set(allErrors);
    const uniqueWarnings = Array.from(new Set(allWarnings)).filter(
      (warning) => !errorSet.has(warning),
    );
    return {
      errors: Array.from(errorSet),
      warnings: uniqueWarnings,
    };
  }, [
    pathValidation,
    segmentValidations,
    segments,
    documentTypeErrors,
    sanityValidationErrors,
  ]);

  // Derived state
  const hasValidationIssues =
    combinedValidation.errors.length > 0 ||
    combinedValidation.warnings.length > 0;
  const hasCriticalErrors = combinedValidation.errors.length > 0;

  return {
    validation: combinedValidation,
    segmentValidations,
    pathValidation,
    documentTypeErrors,
    sanityValidationErrors,
    allErrors: combinedValidation.errors,
    allWarnings: combinedValidation.warnings,
    hasValidationIssues,
    hasCriticalErrors,
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
