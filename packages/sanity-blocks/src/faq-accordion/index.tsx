import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowUpRight, Plus } from "lucide-react";
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
    <section className="py-12 md:py-20" id="faq">
      <div className="container">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-12">
          <div className="flex w-full flex-col items-center gap-4 text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            {title && (
              <h2 className="font-medium text-3xl tracking-tight md:text-5xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <h3 className="w-full font-normal text-lg text-muted-foreground">
                {subtitle}
              </h3>
            )}
          </div>
          <div className="grid w-full gap-4">
            {faqs?.map((faq) => {
              if (!faq?.title) return null;
              const itemId = faq._key ?? faq._id;
              return (
                <details
                  className="faq-disclosure group bg-muted px-4 has-[summary:focus-visible]:outline-1 has-[summary:focus-visible]:outline-offset-2 has-[summary:focus-visible]:outline-foreground"
                  key={`faq-${itemId}`}
                  name={`faq-${_key}`}
                  open={itemId === defaultOpenId}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 py-4 outline-none [&::-webkit-details-marker]:hidden">
                    <h3 className="font-normal text-foreground text-lg leading-6">
                      {faq.title}
                    </h3>
                    <Plus className="pointer-events-none size-5 shrink-0 text-foreground transition-transform duration-200 group-open:rotate-45 dark:text-accent-green" />
                  </summary>
                  {faq.richText?.length ? (
                    <div className="pb-4 text-muted-foreground">
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
            <div className="flex flex-col items-center gap-3 text-center">
              {link?.title && (
                <p className="text-lg text-muted-foreground">{link.title}</p>
              )}
              <Link
                className="flex items-center gap-2"
                href={link.href}
                target={link.openInNewTab ? "_blank" : "_self"}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                aria-label={link.description ?? link.title ?? "Learn more"}
              >
                {link?.description && (
                  <p className="font-medium text-foreground text-lg leading-7">
                    {link.description}
                  </p>
                )}
                <span className="flex items-center justify-center rounded-full bg-accent-green p-1.5 text-accent-green-foreground">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
