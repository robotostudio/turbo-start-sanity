"use client";

import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { useDisclosureAnimation } from "@workspace/sanity-blocks/internal/use-disclosure-animation";
import { cn } from "@workspace/tailwind-config/utils";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { type MouseEvent as ReactMouseEvent, useState } from "react";

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
  "hover-surface group border border-border bg-background px-4 transition-colors duration-150 has-[summary:focus-visible]:[outline:2px_dotted_var(--foreground)] has-[summary:focus-visible]:[outline-offset:-2px] motion-reduce:transition-none";
// `animation-duration-300`, not `duration-300`: the latter also sets
// `transition-duration`, which stretched the hover fade above to the entrance's
// 300ms while the code chip inside switched instantly.
const DISCLOSURE_ANIMATION_CLASS =
  "fade-in slide-in-from-bottom-2 animate-in fill-mode-both animation-duration-300 ease-out motion-reduce:animate-none";

function FaqDisclosure({
  animationDelay,
  faq,
  isOpen,
  onToggle,
}: Readonly<{
  animationDelay: string;
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}>) {
  const { detailsRef, contentRef } = useDisclosureAnimation(isOpen);
  const [initialOpen] = useState(isOpen);

  const handleSummaryClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    onToggle();
  };

  return (
    <details
      className={cn(DISCLOSURE_BASE_CLASS, DISCLOSURE_ANIMATION_CLASS)}
      open={initialOpen}
      ref={detailsRef}
      style={{ animationDelay }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: summary is natively interactive */}
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2.5 py-4 outline-none [&::-webkit-details-marker]:hidden"
        onClick={handleSummaryClick}
      >
        <h3 className="font-normal text-foreground text-lg leading-6">
          {faq.title}
        </h3>
        <Plus
          className={cn(
            "pointer-events-none size-5 shrink-0 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none dark:text-accent-green",
            isOpen && "rotate-45"
          )}
        />
      </summary>
      {faq.richText?.length ? (
        <div className="overflow-hidden" ref={contentRef}>
          <div className="min-h-0 pb-4 text-muted-foreground">
            <RichText className="body-text" richText={faq.richText} />
          </div>
        </div>
      ) : null}
    </details>
  );
}

function FaqList({ faqs }: Readonly<{ faqs: FaqItem[] }>) {
  const defaultFaq = faqs.find((faq) => faq?.title);
  const defaultOpenId = defaultFaq
    ? (defaultFaq._key ?? defaultFaq._id)
    : undefined;
  // Exclusive-open lives in state (not the details `name` attribute) so the
  // sibling that closes animates instead of snapping shut.
  const [openId, setOpenId] = useState(defaultOpenId);

  return (
    <div className="grid content-start gap-4">
      {faqs.map((faq, index) => {
        if (!faq?.title) return null;
        const itemId = faq._key ?? faq._id;
        return (
          <FaqDisclosure
            animationDelay={`${Math.min(index, 8) * 45}ms`}
            faq={faq}
            isOpen={itemId === openId}
            key={`faq-${itemId}`}
            onToggle={() =>
              setOpenId((current) => (current === itemId ? undefined : itemId))
            }
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
    <div className="flex h-full flex-col gap-6">
      <ul className="grid gap-1">
        {categories.map((category, index) => {
          const isActive = index === activeIndex;
          const number = String(index + 1).padStart(2, "0");
          return (
            <li key={`faq-category-${category._key ?? index}`}>
              <button
                aria-pressed={isActive}
                className="focus-ring group flex w-full items-center gap-2 rounded-none px-1 py-0.5 text-left"
                onClick={() => onSelect(index)}
                type="button"
              >
                <span
                  className={cn(
                    "shrink-0 px-1 py-px font-light font-mono text-sm uppercase leading-5 tracking-[0.28px]",
                    isActive
                      ? "bg-accent-green text-accent-green-foreground"
                      : "text-muted-foreground group-hover:bg-foreground group-hover:text-background"
                  )}
                >
                  {number}
                </span>
                <span
                  className={cn(
                    "font-light font-mono text-sm uppercase leading-5 tracking-[0.28px]",
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
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
        className="focus-ring group inline-flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-1 focus-visible:outline-offset-0!"
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

  const validCategories = (categories ?? []).filter((category) =>
    category?.faqs?.some((faq) => faq?.title)
  );

  const hasCategories = validCategories.length > 0;
  const boundedIndex = hasCategories
    ? Math.min(activeIndex, validCategories.length - 1)
    : 0;
  const activeCategory = validCategories[boundedIndex];
  const activeFaqs = activeCategory?.faqs ?? [];
  // Remounts FaqList per category so the default-open item resets.
  const accordionKey = `faq-${_key}-${activeCategory?._key ?? boundedIndex}`;

  return (
    <section className="bg-background pt-20 pb-0.5 sm:pt-28 lg:pt-34" id="faq">
      <div className="container">
        <FaqHeader eyebrow={eyebrow} subtitle={subtitle} title={title} />

        <div className="mt-12 flex flex-col gap-6 lg:mt-16">
          <div
            className={cn(
              "grid items-stretch gap-10 lg:gap-16",
              hasCategories && "lg:grid-cols-[minmax(0,12rem)_1fr]"
            )}
          >
            {hasCategories && (
              <CategoryTabs
                activeIndex={boundedIndex}
                categories={validCategories}
                onSelect={setActiveIndex}
              />
            )}

            <div className="flex flex-col gap-6">
              <FaqList faqs={activeFaqs} key={accordionKey} />
              {link && <FaqContactLink link={link} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
