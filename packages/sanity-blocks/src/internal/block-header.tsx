import type { ReactNode } from "react";

import { BlockEyebrow } from "./block-eyebrow";

/**
 * Shared section-header scaffold used by page-builder blocks: an eyebrow, an
 * optional `block-title` heading, and a body slot. The body is passed as
 * children so each block keeps its exact markup (RichText, a subtitle
 * paragraph, etc.) while the wrapper structure stays in one place.
 */
export function BlockHeader({
  eyebrow,
  title,
  children,
}: Readonly<{
  eyebrow?: string | null;
  title?: string | null;
  children?: ReactNode;
}>) {
  return (
    <div className="flex flex-col items-start gap-6">
      <BlockEyebrow eyebrow={eyebrow} />
      <div className="flex flex-col items-start gap-5">
        {title ? <h2 className="max-w-2xl block-title">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
