"use client";

import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { Button } from "@workspace/ui/components/button";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

export interface SubscribeNewsletterProps {
  action?: ComponentProps<"form">["action"];
  helperText?: RichTextValue;
  method?: ComponentProps<"form">["method"];
  onSubmit?: ComponentProps<"form">["onSubmit"];
  subTitle?: RichTextValue;
  title?: string | null;
}

function SubscribeNewsletterButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      aria-label={pending ? "Subscribing..." : "Subscribe to newsletter"}
      className="h-10 w-full rounded-none px-4 sm:w-auto"
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
    </Button>
  );
}

export function SubscribeNewsletter({
  action,
  title,
  subTitle,
  helperText,
  method,
  onSubmit,
}: Readonly<SubscribeNewsletterProps>) {
  return (
    <section className="py-12 md:py-20" id="subscribe">
      <div className="container">
        <div className="relative overflow-hidden bg-muted bg-grid-dots px-4 py-16 md:px-8 md:py-24">
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-4">
              {title && (
                <h2 className="w-full text-balance font-medium text-4xl leading-[1.05] tracking-[-1.28px] sm:text-5xl md:text-[64px]">
                  {title}
                </h2>
              )}
              {subTitle && (
                <RichText
                  className="text-balance text-lg text-zinc-600 leading-7 dark:text-zinc-200"
                  richText={subTitle}
                />
              )}
            </div>
            <div className="flex w-full flex-col items-center gap-3">
              <form
                action={action}
                className="flex w-full max-w-96 flex-col gap-2 bg-black p-2 has-[input:focus-visible]:rounded-[4px] has-[input:focus-visible]:outline-1 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-zinc-600 sm:flex-row sm:items-center sm:gap-1.5 sm:py-1 sm:pr-1 sm:pl-4"
                method={method ?? "post"}
                onSubmit={onSubmit}
              >
                <input
                  aria-label="Email address"
                  className="w-full min-w-0 flex-1 bg-transparent px-2 py-1 text-base text-zinc-100 outline-none placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-0 sm:py-0 sm:text-sm"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  type="email"
                />
                <SubscribeNewsletterButton />
              </form>
              {helperText && (
                <RichText
                  className="text-sm text-zinc-600 [&_a]:font-medium [&_a]:text-foreground [&_a]:decoration-solid dark:text-zinc-200"
                  richText={helperText}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
