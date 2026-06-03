"use server";

import { revalidateTag, updateTag } from "next/cache";
import { draftMode } from "next/headers";
import { parseTags } from "next-sanity/live";

// Invalidate cache tags on live events so non-preview visitors see edits without refresh.
export async function sanityLiveAction(unsafeTags: unknown) {
  const { isEnabled: isDraftMode } = await draftMode();
  const { tags } = parseTags(unsafeTags);
  for (const tag of tags) {
    if (isDraftMode) {
      revalidateTag(tag, "max");
    } else {
      updateTag(tag);
    }
  }
}
