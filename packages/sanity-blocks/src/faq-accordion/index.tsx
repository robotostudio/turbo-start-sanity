"use client";

import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

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

const DISCLOSURE_BASE_CLASS =
  "faq-disclosure hover-surface group border border-border bg-background px-4 has-[summary:focus-visible]:[outline:2px_solid_var(--foreground)] has-[summary:focus-visible]:[outline-offset:-2px]";
const DISCLOSURE_ANIMATION_CLASS =
  "fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-300 ease-out";

function FaqDisclosure({
  animate = false,
  animationDelay,
  faq,
  name,
  open,
}: Readonly<{
  animate?: boolean;
  animationDelay?: string;
  faq: FaqItem;
  name?: string;
  open?: boolean;
}>) {
  return (
    <details
      className={
        animate
          ? `${DISCLOSURE_BASE_CLASS} ${DISCLOSURE_ANIMATION_CLASS}`
          : DISCLOSURE_BASE_CLASS
      }
      name={name}
      open={open}
      style={animate ? { animationDelay } : undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 py-4 outline-none [&::-webkit-details-marker]:hidden">
        <h3 className="font-normal text-foreground text-lg leading-6">
          {faq.title}
        </h3>
        <Plus className="pointer-events-none size-5 shrink-0 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-open:rotate-45 dark:text-accent-green" />
      </summary>
      {faq.richText?.length ? (
        <div className="min-h-0 overflow-hidden pb-4 text-muted-foreground">
          <RichText className="body-text" richText={faq.richText} />
        </div>
      ) : null}
    </details>
  );
}

// Reserved height of one category list (all its <details> open): the closed
// stack (summary rows + borders + gaps) plus its tallest answer.
function measureCategoryReserved(list: HTMLElement): number {
  const detailsEls = Array.from(
    list.querySelectorAll<HTMLDetailsElement>(":scope > details")
  );
  if (detailsEls.length === 0) return 0;

  const rowGap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
  let closedStackHeight = rowGap * (detailsEls.length - 1);
  let maxContentHeight = 0;
  for (const el of detailsEls) {
    const summary = el.querySelector<HTMLElement>(":scope > summary");
    const content = el.querySelector<HTMLElement>(":scope > summary + div");
    const styles = getComputedStyle(el);
    closedStackHeight +=
      (summary?.offsetHeight ?? 0) +
      (Number.parseFloat(styles.borderTopWidth) || 0) +
      (Number.parseFloat(styles.borderBottomWidth) || 0);
    maxContentHeight = Math.max(maxContentHeight, content?.offsetHeight ?? 0);
  }

  return closedStackHeight + maxContentHeight;
}

function measureTallestReserved(layer: HTMLElement): number | undefined {
  const lists = Array.from(layer.querySelectorAll<HTMLElement>(":scope > div"));
  if (lists.length === 0) return undefined;

  let tallest = 0;
  for (const list of lists) {
    tallest = Math.max(tallest, measureCategoryReserved(list));
  }
  return tallest;
}

function FaqList({
  faqs,
  minHeight,
  name,
}: Readonly<{ faqs: FaqItem[]; minHeight?: number; name: string }>) {
  const defaultFaq = faqs.find((faq) => faq?.title);
  const defaultOpenId = defaultFaq
    ? (defaultFaq._key ?? defaultFaq._id)
    : undefined;

  return (
    <div className="grid content-start gap-4" style={{ minHeight }}>
      {faqs.map((faq, index) => {
        if (!faq?.title) return null;
        const itemId = faq._key ?? faq._id;
        return (
          <FaqDisclosure
            animate
            animationDelay={`${Math.min(index, 8) * 45}ms`}
            faq={faq}
            key={`faq-${itemId}`}
            name={name}
            open={itemId === defaultOpenId}
          />
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
                className="focus-ring flex items-start gap-2 rounded-none px-1 py-0.5 text-left"
                onClick={() => onSelect(index)}
                type="button"
              >
                <span
                  className={`shrink-0 px-1 py-px font-light font-mono text-sm uppercase leading-5 tracking-[0.28px] ${
                    isActive
                      ? "bg-accent-green text-accent-green-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {number}
                </span>
                <span
                  className={`font-light font-mono text-sm uppercase leading-5 tracking-[0.28px] ${
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-muted-foreground"
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
        className="hidden w-full max-w-[149px] flex-1 bg-grid-dots text-zinc-800 lg:block dark:text-zinc-50"
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
      <BlockEyebrow eyebrow={eyebrow} />
      {(title || subtitle) && (
        <div className="flex flex-col gap-5">
          {title && (
            <h2 className="font-normal text-4xl text-foreground leading-tight tracking-[-0.24px] md:text-5xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="body-text max-w-xl text-muted-foreground">
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
        className="focus-ring group flex items-center gap-2 rounded-full px-1 py-0.5"
        href={link.href}
        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        target={link.openInNewTab ? "_blank" : "_self"}
      >
        {link.description && (
          <p className="font-normal text-base text-foreground leading-7">
            {link.description}
          </p>
        )}
        <span className="flex items-center justify-center overflow-hidden rounded-full bg-accent-green p-1.5 text-accent-green-foreground">
          <ArrowUpRight
            className="transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:rotate-45"
            size={14}
          />
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
  const measureRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>();

  const validCategories = (categories ?? []).filter((category) =>
    category?.faqs?.some((faq) => faq?.title)
  );

  // Reserve the tallest possible state across ALL categories so neither
  // toggling an answer nor switching tabs shifts the content below the list.
  // Measured from the hidden always-open copy rendered next to the list.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the categories change
  useLayoutEffect(() => {
    const layer = measureRef.current;
    if (!layer) return;

    const measure = () => {
      const reserved = measureTallestReserved(layer);
      setMinHeight((prev) =>
        reserved !== undefined &&
        prev !== undefined &&
        Math.abs(prev - reserved) <= 1
          ? prev
          : reserved
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    return () => observer.disconnect();
  }, [categories]);
  const hasCategories = validCategories.length > 0;
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

            <div className="relative">
              <FaqList
                faqs={activeFaqs}
                key={accordionName}
                minHeight={minHeight}
                name={accordionName}
              />
              {/* Hidden always-open copy of every category, used only to
                  measure the tallest possible list state. No `name` (items
                  must all stay open) and no entry animations. */}
              <div
                aria-hidden="true"
                className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10"
                inert
                ref={measureRef}
              >
                {validCategories.map((category, categoryIndex) => (
                  <div
                    className="grid content-start gap-4"
                    key={`faq-measure-${category._key ?? categoryIndex}`}
                  >
                    {(category.faqs ?? []).map((faq) =>
                      faq?.title ? (
                        <FaqDisclosure
                          faq={faq}
                          key={`faq-measure-${faq._key ?? faq._id}`}
                          open
                        />
                      ) : null
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {link && <FaqContactLink link={link} />}
        </div>
      </div>
    </section>
  );
}
