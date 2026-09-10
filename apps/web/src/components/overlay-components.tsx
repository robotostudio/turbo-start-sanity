import type { OverlayComponentResolver } from "@sanity/visual-editing/react";

import { InlineText, isInlineEditable } from "@/components/inline-text";

/**
 * Arms double-click typing where `isInlineEditable` allows. Never under a
 * release: `useDocuments` always writes `drafts.<id>`, so the edit would miss
 * the version on screen. Published text is fine: a page with no draft renders
 * from it, and the first save creates the draft. A resolver, not a `plugins`
 * HUD, because only the resolver waits for the optimistic actor
 * `useDocuments` needs.
 */
export const overlayComponents: OverlayComponentResolver = ({
  element,
  node,
  type,
}) => {
  const perspective = node.perspective ?? "drafts";
  const editable =
    (perspective === "drafts" || perspective === "published") &&
    isInlineEditable(element, node.path, type);
  return editable ? InlineText : undefined;
};
