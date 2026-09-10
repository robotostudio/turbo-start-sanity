"use client";

import { VisualEditing } from "next-sanity/visual-editing";

import { overlayComponents } from "@/components/overlay-components";

/**
 * A client component because React won't pass the resolver function from the
 * server layout ("Functions cannot be passed directly to Client Components").
 * Inline editing only on drafts: saves always write `drafts.<id>`, which a
 * published or release preview never shows.
 */
export function VisualEditingLayer({
  inlineEditing,
}: Readonly<{ inlineEditing: boolean }>) {
  return (
    <VisualEditing components={inlineEditing ? overlayComponents : undefined} />
  );
}
