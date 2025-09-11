import { useCallback, useEffect, useState } from "react";
import type { SanityClient, SanityDocument, SlugValue } from "sanity";
import { set, useClient, useFormValue } from "sanity";
import slugify from "slugify";

import { useSlugValidation } from "./use-slug-validation";

type SlugGenerationOptions = {
  onChange: (patch: any) => void;
};

function transformSlug(slug: string) {
  return slugify(slug, {
    lower: true,
    remove: /[^a-zA-Z0-9\s-]/g, // Removes all characters except letters, numbers, spaces, and hyphens
  });
}
function breakSlugIntoSegments(slug: string) {
  return slug.split("/").filter(Boolean);
}

async function listAllSlugs(client: SanityClient) {
  const slugs = await client.fetch<string[]>(`
    *[defined(slug.current) && _type in ["page", "blog", "homePage", "blogIndex"]].slug.current
  `);
  const uniqueSlugs = Array.from(new Set(slugs));
  return uniqueSlugs.map(breakSlugIntoSegments);
}

function getSlugOptionsAtLevel(
  allSlugs: string[][],
  level: number,
  prefix: string[] = [],
): string[] {
  const options = new Set<string>();

  for (const segments of allSlugs) {
    // Check if this slug has enough segments for the requested level
    if (segments.length < level) continue;

    // Check if the prefix matches
    const matchesPrefix = prefix.every(
      (prefixSegment, index) => segments[index] === prefixSegment,
    );

    if (!matchesPrefix) continue;

    // Get the segment at the requested level (level is 1-based)
    const segmentAtLevel = segments[level - 1];
    if (segmentAtLevel) {
      options.add(segmentAtLevel);
    }
  }

  return Array.from(options).sort();
}

// Validation functions are now imported from slug-validation.ts

export function useSlugGeneration({ onChange }: SlugGenerationOptions) {
  const document = useFormValue([]) as SanityDocument & {
    slug?: SlugValue;
    title?: string;
  };

  const client = useClient({ apiVersion: "2025-09-09" });

  const [allSlugs, setAllSlugs] = useState<string[][]>([]);
  useEffect(() => {
    listAllSlugs(client).then(setAllSlugs);
  }, [client]);

  const currentSlug = document?.slug?.current || "";

  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [finalSlug, setFinalSlug] = useState("");

  useEffect(() => {
    const allSegments = currentSlug.split("/").filter(Boolean);
    if (allSegments.length > 0) {
      setPathSegments(allSegments.slice(0, -1));
      setFinalSlug(allSegments[allSegments.length - 1]);
    } else {
      setPathSegments([]);
      setFinalSlug("");
    }
  }, [currentSlug]);

  const updateFullSlug = useCallback(
    (newPathSegments: string[], newFinalSlug: string) => {
      const slug = newFinalSlug.replace(/\//g, "");
      if (slug) {
        const fullPath = `/${[...newPathSegments, slug].join("/")}`;
        onChange(
          set({
            current: fullPath || "/",
            _type: "slug",
          }),
        );
      }
    },
    [onChange],
  );

  const handleUpdateFinalSlug = useCallback(
    (newFinalSlug: string) => {
      setFinalSlug(newFinalSlug.replace(/\//g, ""));
      updateFullSlug(pathSegments, newFinalSlug);
    },
    [pathSegments, updateFullSlug],
  );

  const handleUpdatePathSegment = useCallback(
    (index: number, value: string) => {
      if (pathSegments[index] === value) {
        return;
      }
      const newPathSegments = pathSegments.slice(0, index);
      newPathSegments.push(value);
      setPathSegments(newPathSegments);
      updateFullSlug(newPathSegments, finalSlug);
    },
    [finalSlug, pathSegments, updateFullSlug],
  );

  const handleAddPathSegment = useCallback(
    (segment = "new-segment") => {
      const newPathSegments = [...pathSegments, segment];
      setPathSegments(newPathSegments);
      updateFullSlug(newPathSegments, finalSlug);
    },
    [finalSlug, pathSegments, updateFullSlug],
  );

  const handleRemovePathSegment = useCallback(
    (index: number) => {
      const newPathSegments = pathSegments.slice(0, index);
      setPathSegments(newPathSegments);
      updateFullSlug(newPathSegments, finalSlug);
    },
    [finalSlug, pathSegments, updateFullSlug],
  );

  const generateSlugFromTitle = useCallback(() => {
    const title = document?.title;
    if (!title) return;

    const newFinalSlug = transformSlug(title);
    setFinalSlug(newFinalSlug);
    updateFullSlug(pathSegments, newFinalSlug);
  }, [document?.title, pathSegments, updateFullSlug]);

  const getPathSegmentOptions = useCallback(
    (index: number) => {
      const prefix = pathSegments.slice(0, index);
      return getSlugOptionsAtLevel(allSlugs, index + 1, prefix);
    },
    [allSlugs, pathSegments],
  );

  // Use centralized validation hook - single source of truth
  const { allErrors, allWarnings } = useSlugValidation({
    slug: currentSlug,
    includeSanityValidation: false, // This hook is for internal validation only
  });

  return {
    currentSlug,
    pathSegments,
    finalSlug,
    generateSlugFromTitle,
    handleUpdateFinalSlug,
    handleUpdatePathSegment,
    handleAddPathSegment,
    handleRemovePathSegment,
    getPathSegmentOptions,
    validation: { errors: allErrors, warnings: allWarnings },
  };
}
