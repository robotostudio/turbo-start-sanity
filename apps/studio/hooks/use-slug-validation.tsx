import { useMemo } from "react";
import type { SanityDocument } from "sanity";
import { getPublishedId, useFormValue, useValidationStatus } from "sanity";

import {
  getDocumentTypeConfig,
  validateSlug,
} from "@/utils/slug-validation";

export type UseSlugValidationOptions = {
  slug: string | undefined | null;
  documentType?: string;
  includeSanityValidation?: boolean;
};

export type UseSlugValidationResult = {
  allErrors: string[];
  allWarnings: string[];
};

/** Unified slug validation hook — returns deduplicated errors and warnings. */
export function useSlugValidation(
  options: UseSlugValidationOptions
): UseSlugValidationResult {
  const {
    slug,
    documentType: providedType,
    includeSanityValidation = true,
  } = options;

  const document = useFormValue([]) as SanityDocument;
  const documentType = providedType || document?._type;

  const config = useMemo(
    () => (documentType ? getDocumentTypeConfig(documentType) : {}),
    [documentType]
  );

  // Sanity schema-level validation errors (async, from useValidationStatus)
  const publishedId = document?._id ? getPublishedId(document._id) : "";
  const { validation: sanityValidation } = useValidationStatus(
    publishedId,
    document?._type,
    true
  );

  const sanityErrors = useMemo(() => {
    if (!includeSanityValidation) return [];
    return sanityValidation
      .filter(
        (v) =>
          (v.path.includes("current") || v.path.includes("slug")) && v.message
      )
      .map((v) => v.message);
  }, [sanityValidation, includeSanityValidation]);

  // Core validation — no early return for empty slugs
  const validation = useMemo(
    () => validateSlug(slug, config),
    [slug, config]
  );

  // Merge & deduplicate
  return useMemo(() => {
    const allErrors = [...new Set([...validation.errors, ...sanityErrors])];
    const errorSet = new Set(allErrors);
    const allWarnings = [...new Set(validation.warnings)].filter(
      (w) => !errorSet.has(w)
    );
    return { allErrors, allWarnings };
  }, [validation, sanityErrors]);
}
