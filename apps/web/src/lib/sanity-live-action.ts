"use server";

import { updateTag } from "next/cache";
import { parseTags } from "next-sanity/live";

// Runs every time Sanity reports a content change to <SanityLive>.
// We use `updateTag` (not `revalidateTag`) so the page the user is currently
// viewing re-renders with the new content right away — `revalidateTag` would
// only mark the cache stale for the next request, leaving the open page
// unchanged until a manual reload. This keeps both the Presentation (draft)
// preview and regular published pages updating live.
export async function sanityLiveAction(unsafeTags: unknown) {
  const { tags } = parseTags(unsafeTags);
  for (const tag of tags) {
    updateTag(tag);
  }
}
