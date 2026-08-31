"use client";

import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import { Button } from "@workspace/ui/components/button";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

export interface NewsletterTestimonial {
  authorImage?: SanityImageData | null;
  authorName?: string | null;
  authorRole?: string | null;
  eyebrow?: string | null;
  quote?: RichTextValue;
}

export interface SubscribeNewsletterProps {
  action?: ComponentProps<"form">["action"];
  helperText?: RichTextValue;
  method?: ComponentProps<"form">["method"];
  onSubmit?: ComponentProps<"form">["onSubmit"];
  subTitle?: RichTextValue;
  testimonial?: NewsletterTestimonial | null;
  title?: string | null;
}

function SubscribeNewsletterButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      aria-label={pending ? "Subscribing..." : "Subscribe to newsletter"}
      className="shrink-0 rounded-none px-5 py-2.5"
      disabled={pending}
      size="sm"
      type="submit"
      variant="secondary"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin"
          size={16}
          strokeWidth={2}
        />
      ) : (
        "Subscribe"
      )}
      <span aria-live="polite" className="sr-only" role="status">
        {pending ? "Subscribing…" : ""}
      </span>
    </Button>
  );
}

function TestimonialPanel({
  testimonial,
}: Readonly<{ testimonial: NewsletterTestimonial }>) {
  const { eyebrow, quote, authorImage, authorName, authorRole } = testimonial;
  return (
    <div className="bleed-x bg-grid-dots p-[var(--container-px,0.5rem)] text-zinc-800 lg:mx-0 lg:p-8 dark:text-zinc-50">
      <div className="flex h-full flex-col gap-12 bg-background p-8">
        <BlockEyebrow eyebrow={eyebrow} />
        <div className="flex flex-col gap-8">
          <RichText
            className="body-text text-muted-foreground [&_strong]:font-normal [&_strong]:text-foreground"
            richText={quote}
          />
          <div className="flex items-center gap-4">
            {authorImage?.id && (
              <div className="size-[42px] shrink-0 overflow-hidden">
                <SanityImage
                  className="h-full w-full rounded-none! object-cover"
                  height={42}
                  image={authorImage}
                  loading="lazy"
                  width={42}
                />
              </div>
            )}
            <div className="flex flex-col text-base leading-6">
              {authorName && (
                <span className="font-medium text-foreground">
                  {authorName}
                </span>
              )}
              {authorRole && (
                <span className="text-muted-foreground">{authorRole}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscribeNewsletter({
  action,
  title,
  subTitle,
  helperText,
  method,
  onSubmit,
  testimonial,
}: Readonly<SubscribeNewsletterProps>) {
  // A cleared Sanity object is still truthy; only treat the testimonial as
  // present when it actually carries content.
  const hasTestimonialContent = Boolean(
    testimonial &&
      (testimonial.eyebrow ||
        testimonial.authorName ||
        testimonial.authorRole ||
        testimonial.authorImage?.id ||
        (Array.isArray(testimonial.quote) && testimonial.quote.length > 0))
  );

  return (
    <section className="block-section" id="subscribe">
      <div className="container">
        <div
          className={cn(
            hasTestimonialContent &&
              "grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-stretch lg:gap-48"
          )}
        >
          <div className="flex max-w-3xl flex-col items-start gap-8 pb-12">
            <div className="flex flex-col items-start gap-5">
              {title && (
                <h2 className="max-w-none text-balance font-normal text-4xl text-foreground leading-tight tracking-[-0.24px] sm:text-5xl">
                  {title}
                </h2>
              )}
              {subTitle && (
                <RichText
                  className="body-text max-w-[360px] text-muted-foreground"
                  richText={subTitle}
                />
              )}
            </div>
            <div className="flex w-full flex-col items-start gap-3">
              <form
                action={action}
                className="flex w-full items-center gap-1.5 bg-muted py-1.5 pr-1.5 pl-4 has-[input:focus-visible]:[outline:2px_dotted_var(--foreground)] has-[input:focus-visible]:outline-offset-2"
                method={method ?? "post"}
                onSubmit={onSubmit}
              >
                <input
                  aria-label="Email address"
                  className="w-full min-w-0 flex-1 bg-transparent py-1.5 text-base text-foreground outline-none [--autofill-bg:var(--muted)] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  type="email"
                />
                <SubscribeNewsletterButton />
              </form>
              {helperText && (
                <RichText
                  className="text-muted-foreground text-sm leading-5 [&_a]:rounded-none [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-solid"
                  richText={helperText}
                />
              )}
            </div>
          </div>
          {hasTestimonialContent && testimonial && (
            <TestimonialPanel testimonial={testimonial} />
          )}
        </div>
      </div>
    </section>
  );
}
