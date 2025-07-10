import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { stegaClean } from "next-sanity";

import type { PagebuilderType } from "@/types";

import { FaqJsonLd } from "../json-ld";
import { RichText } from "../richtext";

type FaqAccordionProps = PagebuilderType<"faqAccordion">;

export function FaqAccordion({
  eyebrow,
  title,
  subtitle,
  faqs,
  link,
}: FaqAccordionProps) {
  return (
    <section id="faq" className="my-8">
      <FaqJsonLd faqs={stegaClean(faqs)} />
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            <Badge variant="secondary">{eyebrow}</Badge>
            <h2 className="text-3xl font-semibold md:text-5xl">{title}</h2>
            <h3 className="text-lg font-normal text-[#374151] text-balance dark:text-zinc-400">
              {subtitle}
            </h3>
          </div>
        </div>
        <div className="my-16 max-w-xl mx-auto">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="3"
          >
            {faqs?.map((faq, index) => (
              <AccordionItem
                value={faq?._id}
                key={`AccordionItem-${faq?._id}-${index}`}
                className="py-2"
              >
                <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline group">
                  {faq?.title}
                </AccordionTrigger>
                <AccordionContent className="pb-2 text-muted-foreground">
                  <RichText
                    richText={faq?.richText ?? []}
                    className="text-sm md:text-base"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {link?.href && (
            <div className="w-full py-6">
              <p className="mb-1 text-xs">{link?.title}</p>
              <Link
                href={link.href ?? "#"}
                target={link.openInNewTab ? "_blank" : "_self"}
                className="flex items-center gap-2"
              >
                <p className="text-[15px] font-[500] leading-6">
                  {link?.description}
                </p>
                <span className="rounded-full border p-1">
                  <ArrowUpRight
                    size={16}
                    className="text-[#374151] dark:text-neutral-300"
                  />
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
