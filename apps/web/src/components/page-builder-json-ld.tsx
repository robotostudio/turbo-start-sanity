import { faqAccordionToJsonLd } from "@workspace/sanity-blocks/faq-accordion/json-ld";
import { stegaClean } from "next-sanity";

import { JsonLdScript } from "@/components/json-ld";
import type { PageBuilderBlock, PagebuilderType } from "@/types";

/**
 * Emits ONE FAQPage for the whole page: Google reads a single FAQPage per URL,
 * so a second faqAccordion block's questions are dropped if it gets its own.
 */
export function PageBuilderJsonLd({
  pageBuilder,
}: Readonly<{
  pageBuilder?: PageBuilderBlock[] | null;
}>) {
  if (!pageBuilder?.length) return null;

  const questions = pageBuilder.flatMap((block) => {
    if (block?._type !== "faqAccordion") return [];
    const data = faqAccordionToJsonLd(
      stegaClean(block as PagebuilderType<"faqAccordion">)
    );
    return data?.mainEntity ?? [];
  });

  if (!questions.length) return null;

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions,
      }}
      id="faq-json-ld"
    />
  );
}
