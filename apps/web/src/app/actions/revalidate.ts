"use server";

import { revalidateTag, updateTag } from "next/cache";
import { draftMode } from "next/headers";
import { parseTags } from "next-sanity/live";

// Server action run by <SanityLive> on every live content-change event.
// Draft: `updateTag` (read-your-own-writes) so editors see their own edit in
// Presentation. Published: `revalidateTag` + `"refresh"` so open visitor tabs
// re-render with the new content.
export async function revalidateSyncTags(unsafeTags: unknown) {
  const { isEnabled: isDraftMode } = await draftMode();
  const { tags } = parseTags(unsafeTags);

  if (isDraftMode) {
    for (const tag of tags) {
      updateTag(tag);
    }
    // `updateTag` alone doesn't trigger the router refresh Presentation needs.
    return "refresh" as const;
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  return "refresh" as const;
}
