import type { Answer, FAQPage, Question, WithContext } from "schema-dts";

type RichTextChild = { _type: string; text?: string };
type RichTextBlock = { _type: string; children?: RichTextChild[] };

type FaqInput = { title?: string | null; richText?: RichTextBlock[] | null };

export type FaqAccordionInput = { faqs?: FaqInput[] | null };

function extractPlainText(richText: RichTextBlock[]): string {
  return richText
    .filter((block) => block._type === "block" && Array.isArray(block.children))
    .map((block) =>
      (block.children ?? [])
        .filter((child) => child._type === "span")
        .map((child) => child.text ?? "")
        .join("")
    )
    .join(" ")
    .trim();
}

/**
 * Builds FAQPage JSON-LD from a faqAccordion block's data.
 *
 * PRECONDITION: `block` must already be stega-cleaned by the caller. This is a
 * pure serializer in a headless package and intentionally does not import
 * next-sanity's `stegaClean`; passing stega-encoded fields would leak invisible
 * characters into the emitted JSON-LD. The app boundary
 * (page-builder-json-ld.tsx) owns the cleaning.
 */
export function faqAccordionToJsonLd(
  block: FaqAccordionInput
): WithContext<FAQPage> | null {
  const validFaqs = (block.faqs ?? []).filter(
    (faq): faq is FaqInput & { title: string; richText: RichTextBlock[] } =>
      Boolean(faq.title && faq.richText)
  );
  if (!validFaqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map(
      (faq): Question => ({
        "@type": "Question",
        name: faq.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: extractPlainText(faq.richText),
        } as Answer,
      })
    ),
  };
}
