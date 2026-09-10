"use client";

import { VisualEditing } from "next-sanity/visual-editing";

import { overlayComponents } from "@/components/overlay-components";

/**
 * `<VisualEditing>` with this app's overlay components. Its own client
 * component because the resolver is a function, which React refuses to pass
 * from the server layout ("Functions cannot be passed directly to Client
 * Components"). Rendered only in draft mode, so visitors never mount it.
 */
export function VisualEditingLayer() {
  return <VisualEditing components={overlayComponents} />;
}
