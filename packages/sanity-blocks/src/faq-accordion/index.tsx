import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowUpRight, ChevronDownIcon } from "lucide-react";
import Link from "next/link";

export interface FaqItem {
  _key?: string | null;
  _id: string;
  richText?: RichTextValue;
  title?: string | null;
}

export interface FaqLink {
  _key?: string | null;
  description?: string | null;
  href?: string | null;
  openInNewTab?: boolean | null;
  title?: string | null;
}

export interface FaqAccordionProps {
  _key?: string;
  eyebrow?: string | null;
  faqs?: FaqItem[] | null;
  link?: FaqLink | null;
  subtitle?: string | null;
  title?: string | null;
}

export function FaqAccordion({
  _key,
  eyebrow,
  title,
  subtitle,
  faqs,
  link,
}: Readonly<FaqAccordionProps>) {
  const defaultFaq = faqs?.find((faq) => faq?.title);
  const defaultOpenId = defaultFaq
    ? (defaultFaq._key ?? defaultFaq._id)
    : undefined;

  return (
    <section className="my-8" id="faq">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            {title && (
              <h2 className="font-semibold text-3xl md:text-5xl">{title}</h2>
            )}
            {subtitle && (
              <h3 className="text-balance font-normal text-[#374151] text-lg dark:text-zinc-400">
                {subtitle}
              </h3>
            )}
          </div>
        </div>
        <div className="mx-auto my-16 max-w-xl">
          <div className="w-full">
            {faqs?.map((faq) => {
              // Skip items without a title
              if (!faq?.title) return null;
              const itemId = faq._key ?? faq._id;
              return (
                <details
                  className="faq-disclosure group border-b py-2 last:border-b-0"
                  key={`faq-${itemId}`}
                  name={`faq-${_key}`}
                  open={itemId === defaultOpenId}
                >
                  <summary className="flex cursor-default list-none items-start justify-between gap-4 rounded-md py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    <h3 className="font-medium text-[15px] leading-6">
                      {faq.title}
                    </h3>
                    <ChevronDownIcon className="pointer-events-none mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  {faq.richText?.length ? (
                    <div className="pb-2 text-muted-foreground">
                      <RichText
                        className="text-sm md:text-base"
                        richText={faq.richText}
                      />
                    </div>
                  ) : null}
                </details>
              );
            })}
          </div>

          {link?.href && (link?.description || link?.title) && (
            <div className="w-full py-6">
              {link?.title && <p className="mb-1 text-xs">{link.title}</p>}
              <Link
                className="flex items-center gap-2"
                href={link.href}
                target={link.openInNewTab ? "_blank" : "_self"}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                aria-label={link.description ?? link.title ?? "Learn more"}
              >
                {link?.description && (
                  <p className="font-medium text-[15px] leading-6">
                    {link.description}
                  </p>
                )}
                <span className="rounded-full border p-1">
                  <ArrowUpRight
                    className="text-[#374151] dark:text-neutral-300"
                    size={16}
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
