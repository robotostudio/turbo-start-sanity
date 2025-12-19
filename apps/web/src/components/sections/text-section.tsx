"use client";

import { cn } from "@workspace/ui/lib/utils";
import { stegaClean } from "next-sanity";

import type { PagebuilderType, SanityRichTextProps } from "@/types";
import { RichText } from "../elements/rich-text";

type TextSectionProps = PagebuilderType<"textSection">;

export function TextSection({ richText, columnVariant }: TextSectionProps) {
  if (!richText) {
    return null;
  }

  const cleanColumnVariant = stegaClean(columnVariant);
  const columnClasses = cn({
    "columns-1": cleanColumnVariant === "single",
    "columns-1 md:columns-2": cleanColumnVariant === "two",
    "columns-1 md:columns-3": cleanColumnVariant === "three",
  });

  return (
    <section className="container mx-auto px-4 pt-16 pb-8">
      <div className={columnClasses}>
        <RichText richText={richText as SanityRichTextProps} />
      </div>
    </section>
  );
}
