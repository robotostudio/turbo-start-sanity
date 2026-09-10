import type { OverlayComponentResolver } from "@sanity/visual-editing/react";

import { InlineText, isInlineEditable } from "@/components/inline-text";

/** A resolver, not a `plugins` HUD: only the resolver waits for the
 * optimistic actor `useDocuments` needs. */
export const overlayComponents: OverlayComponentResolver = ({
  element,
  node,
  type,
}) => (isInlineEditable(element, node.path, type) ? InlineText : undefined);
