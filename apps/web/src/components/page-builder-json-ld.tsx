import { faqAccordionToJsonLd } from "@workspace/sanity-blocks/faq-accordion/json-ld";
import { stegaClean } from "next-sanity";

import { JsonLdScript } from "@/components/json-ld";
import type { PageBuilderBlock, PagebuilderType } from "@/types";

export function PageBuilderJsonLd({
  pageBuilder,
}: {
  pageBuilder?: PageBuilderBlock[] | null;
}) {
  if (!pageBuilder?.length) return null;

  return (
    <>
      {pageBuilder.map((block) => {
        if (!block || block._type !== "faqAccordion") return null;
        const data = faqAccordionToJsonLd(
          stegaClean(block as PagebuilderType<"faqAccordion">)
        );
        if (!data) return null;
        return (
          <JsonLdScript
            data={data}
            id={`faq-json-ld-${block._key}`}
            key={`faq-json-ld-${block._key}`}
          />
        );
      })}
    </>
  );
}
