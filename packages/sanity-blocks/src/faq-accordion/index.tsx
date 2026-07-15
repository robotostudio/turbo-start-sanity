"use client";

import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface FaqItem {
  _key?: string | null;
  _id: string;
  richText?: RichTextValue;
  title?: string | null;
}

export interface FaqCategory {
  _key?: string | null;
  title?: string | null;
  faqs?: FaqItem[] | null;
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
  categories?: FaqCategory[] | null;
  eyebrow?: string | null;
  link?: FaqLink | null;
  subtitle?: string | null;
  title?: string | null;
}

function FaqList({ faqs, name }: Readonly<{ faqs: FaqItem[]; name: string }>) {
  const defaultFaq = faqs.find((faq) => faq?.title);
  const defaultOpenId = defaultFaq
    ? (defaultFaq._key ?? defaultFaq._id)
    : undefined;

  return (
    <div className="grid animate-in content-start gap-4 fade-in duration-300">
      {faqs.map((faq) => {
        if (!faq?.title) return null;
        const itemId = faq._key ?? faq._id;
        return (
          <details
            className="faq-disclosure group border border-border bg-background px-4 transition-colors hover:border-foreground/20 has-[summary:focus-visible]:[outline:1px_solid_var(--foreground)] has-[summary:focus-visible]:outline-offset-2"
            key={`faq-${itemId}`}
            name={name}
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
  );
}

function CategoryTabs({
  categories,
  activeIndex,
  onSelect,
}: Readonly<{
  categories: FaqCategory[];
  activeIndex: number;
  onSelect: (index: number) => void;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-1">
        {categories.map((category, index) => {
          const isActive = index === activeIndex;
          const number = String(index + 1).padStart(2, "0");
          return (
            <li key={`faq-category-${category._key ?? index}`}>
              <button
                aria-pressed={isActive}
                className="focus-ring flex items-start gap-2 rounded-md px-1 py-0.5 text-left"
                onClick={() => onSelect(index)}
                type="button"
              >
                <span
                  className={`shrink-0 px-1 py-px font-mono text-sm uppercase tracking-wider ${
                    isActive
                      ? "bg-accent-green text-accent-green-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {number}
                </span>
                <span
                  className={`font-mono text-sm uppercase tracking-wider ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {category.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div
        aria-hidden="true"
        className="hidden w-full max-w-[149px] flex-1 bg-grid-dots-dense text-muted-foreground lg:block"
      />
    </div>
  );
}

function FaqHeader({
  eyebrow,
  title,
  subtitle,
}: Readonly<Pick<FaqAccordionProps, "eyebrow" | "title" | "subtitle">>) {
  return (
    <div className="flex flex-col items-start gap-6">
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
          <span className="size-2 shrink-0 rounded-[1px] bg-accent-green" />
          <span className="font-mono text-muted-foreground text-sm uppercase tracking-wider">
            {eyebrow}
          </span>
        </div>
      )}
      {(title || subtitle) && (
        <div className="flex flex-col gap-5">
          {title && (
            <h2 className="font-normal text-4xl text-foreground tracking-tight md:text-5xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="max-w-xl text-lg text-muted-foreground leading-7">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FaqContactLink({ link }: Readonly<{ link: FaqLink }>) {
  if (!(link.href && (link.description || link.title))) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {link.title && (
        <p className="text-base text-muted-foreground">{link.title}</p>
      )}
      <Link
        aria-label={link.description ?? link.title ?? "Learn more"}
        className="focus-ring-inset flex items-center gap-2 rounded-md px-1 py-0.5"
        href={link.href}
        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        target={link.openInNewTab ? "_blank" : "_self"}
      >
        {link.description && (
          <p className="font-normal text-base text-foreground leading-7">
            {link.description}
          </p>
        )}
        <span className="flex items-center justify-center rounded-full bg-accent-green p-1.5 text-accent-green-foreground">
          <ArrowUpRight size={14} />
        </span>
      </Link>
    </div>
  );
}

export function FaqAccordion({
  _key,
  categories,
  eyebrow,
  title,
  subtitle,
  link,
}: Readonly<FaqAccordionProps>) {
  const [activeIndex, setActiveIndex] = useState(0);

  const validCategories = (categories ?? []).filter((category) =>
    category?.faqs?.some((faq) => faq?.title)
  );
  const hasCategories = validCategories.length > 0;
  // Default to the first category; clamp any stale index into range.
  const boundedIndex = hasCategories
    ? Math.min(activeIndex, validCategories.length - 1)
    : 0;
  const activeCategory = validCategories[boundedIndex];
  const activeFaqs = activeCategory?.faqs ?? [];
  const accordionName = `faq-${_key}-${activeCategory?._key ?? activeIndex}`;

  return (
    <section
      className="bg-background pt-20 pb-0 sm:pt-28 lg:pt-[136px]"
      id="faq"
    >
      <div className="container">
        <FaqHeader eyebrow={eyebrow} subtitle={subtitle} title={title} />

        <div className="mt-12 flex flex-col gap-6 lg:mt-16">
          <div
            className={`grid items-stretch gap-10 lg:gap-16 ${
              hasCategories ? "lg:grid-cols-[minmax(0,12rem)_1fr]" : ""
            }`}
          >
            {hasCategories && (
              <CategoryTabs
                activeIndex={boundedIndex}
                categories={validCategories}
                onSelect={setActiveIndex}
              />
            )}

            <FaqList
              faqs={activeFaqs}
              key={accordionName}
              name={accordionName}
            />
          </div>

          {link && <FaqContactLink link={link} />}
        </div>
      </div>
    </section>
  );
}
