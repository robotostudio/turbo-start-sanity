"use client";

import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { useDisclosureAnimation } from "@workspace/sanity-blocks/internal/use-disclosure-animation";
import { cn } from "@workspace/tailwind-config/utils";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

const ASK_ENDPOINT = "/api/ask";
const ASK_MIN_LENGTH = 3;
const ASK_MAX_LENGTH = 500;
const ASK_EMPTY_ANSWER = "Sorry, I couldn't find an answer to that.";
const ASK_FALLBACK_ERROR = "Sorry, something went wrong. Please try again.";

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
  "group border border-border bg-background px-4 transition-colors duration-150 has-[summary:focus-visible]:[outline:2px_dotted_var(--foreground)] has-[summary:focus-visible]:[outline-offset:-2px] motion-reduce:transition-none";
// `animation-duration-300`, not `duration-300`: the latter also sets
// `transition-duration`, which stretched the hover fade above to the entrance's
// 300ms while the code chip inside switched instantly.
const DISCLOSURE_ANIMATION_CLASS =
  "fade-in slide-in-from-bottom-2 animate-in fill-mode-both animation-duration-300 ease-out motion-reduce:animate-none";

function Disclosure({
  animationDelay,
  children,
  isOpen,
  onToggle,
  title,
}: Readonly<{
  animationDelay: string;
  children?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  title: ReactNode;
}>) {
  const { detailsRef, contentRef } = useDisclosureAnimation(isOpen);
  const [initialOpen] = useState(isOpen);

  const handleSummaryClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    onToggle();
  };

  return (
    <details
      className={cn(
        DISCLOSURE_BASE_CLASS,
        DISCLOSURE_ANIMATION_CLASS,
        // Open item is a settled surface: no hover wash, by design.
        isOpen
          ? "border-transparent bg-zinc-100 dark:bg-zinc-900"
          : "hover-surface"
      )}
      open={initialOpen}
      ref={detailsRef}
      style={{ animationDelay }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: summary is natively interactive */}
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2.5 py-4 outline-none [&::-webkit-details-marker]:hidden"
        onClick={handleSummaryClick}
      >
        <h3 className="font-medium text-foreground text-lg leading-6">
          {title}
        </h3>
        <Plus
          className={cn(
            "pointer-events-none size-5 shrink-0 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none dark:text-accent-green",
            isOpen && "rotate-45"
          )}
        />
      </summary>
      {children ? (
        <div className="overflow-hidden" ref={contentRef}>
          <div className="min-h-0 pb-4 text-muted-foreground">{children}</div>
        </div>
      ) : null}
    </details>
  );
}

function FaqDisclosure({
  faq,
  ...props
}: Readonly<{
  animationDelay: string;
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}>) {
  return (
    <Disclosure {...props} title={faq.title}>
      {faq.richText?.length ? (
        <RichText className="body-text" richText={faq.richText} />
      ) : null}
    </Disclosure>
  );
}

async function readErrorMessage(response: Response) {
  if (response.headers.get("content-type")?.includes("application/json")) {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : ASK_FALLBACK_ERROR;
  }
  return (await response.text()) || ASK_FALLBACK_ERROR;
}

async function readTextStream(
  response: Response,
  onChunk: (chunk: string) => void
) {
  if (!response.body) {
    onChunk(await response.text());
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

function askButtonLabel(showsAsk: boolean, expanded: boolean) {
  if (showsAsk) return "Ask";
  return expanded ? "Hide answer" : "Show answer";
}

const ARROW_FRAMES = [
  [0, 1, 0, 0, 1, 1, 0, 1, 0],
  [0, 0, 0, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 1, 1, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 0, 0, 0],
] as const;

const FRAME_MS = 320;

function ArrowGlyph() {
  const [frame, setFrame] = useState(0);
  // Steps the 3x3 glyph through its four frames.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % ARROW_FRAMES.length),
      FRAME_MS
    );
    return () => window.clearInterval(timer);
  }, []);
  const dots = ARROW_FRAMES[frame] ?? ARROW_FRAMES[0];
  return (
    <span aria-hidden="true" className="grid grid-cols-3 gap-[2px]">
      {dots.map((on, index) => (
        <span
          className={cn(
            "size-[3px] rounded-full bg-current transition-opacity duration-200 motion-reduce:transition-none",
            on ? "opacity-100" : "opacity-20"
          )}
          key={index}
        />
      ))}
    </span>
  );
}

function Thinking() {
  return (
    <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
      <ArrowGlyph />
      <span className="animate-pulse motion-reduce:animate-none">
        Thinking...
      </span>
    </span>
  );
}

function AskAnswer({
  answer,
  error,
  isAsking,
}: Readonly<{ answer: string; error: string; isAsking: boolean }>) {
  if (error) return <p>{error}</p>;
  if (isAsking && !answer) {
    return <Thinking />;
  }
  return (
    <p className="whitespace-pre-wrap">
      {answer || (isAsking ? "" : ASK_EMPTY_ANSWER)}
    </p>
  );
}

function AskItem({ animationDelay }: Readonly<{ animationDelay: string }>) {
  const answerId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Stops the request, and the billed stream behind it, when the row unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [isAsking, startAsking] = useTransition();

  const trimmed = question.trim();
  const hasAnswer = asked !== "";
  const expanded = open && hasAnswer;
  const isNewQuestion =
    trimmed !== asked &&
    trimmed.length >= ASK_MIN_LENGTH &&
    trimmed.length <= ASK_MAX_LENGTH;

  const ask = async (text: string, controller: AbortController) => {
    try {
      const response = await fetch(ASK_ENDPOINT, {
        body: JSON.stringify({ question: text }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }
      await readTextStream(response, (chunk) => {
        if (!controller.signal.aborted) {
          setAnswer((current) => current + chunk);
        }
      });
    } catch {
      if (!controller.signal.aborted) setError(ASK_FALLBACK_ERROR);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    setQuestion(event.target.value);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAsking) return;
    if (!isNewQuestion) {
      if (hasAnswer) setOpen((current) => !current);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    // Reset outside the transition so streamed chunks append to "".
    setAnswer("");
    setError("");
    setAsked(trimmed);
    setOpen(true);
    startAsking(() => ask(trimmed, controller));
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setQuestion("");
    setAsked("");
    setAnswer("");
    setError("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "border border-border bg-background px-4 transition-colors duration-150 has-[input:focus-visible]:[outline:2px_dotted_var(--foreground)] has-[input:focus-visible]:[outline-offset:-2px] motion-reduce:transition-none",
        DISCLOSURE_ANIMATION_CLASS,
        expanded
          ? "border-transparent bg-zinc-100 dark:bg-zinc-900"
          : "hover-surface"
      )}
      style={{ animationDelay }}
    >
      <form className="flex items-center py-4" onSubmit={handleSubmit}>
        <input
          aria-label="Ask your own question"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-medium text-foreground text-lg leading-6 outline-none placeholder:font-normal placeholder:text-muted-foreground"
          enterKeyHint="send"
          maxLength={ASK_MAX_LENGTH}
          name="question"
          onChange={handleChange}
          placeholder="Can't find it? Type your own question here…"
          ref={inputRef}
          value={question}
        />
        {question || hasAnswer ? (
          <>
            <button
              className="focus-ring -my-2 shrink-0 rounded-none px-2 py-2 text-muted-foreground text-base leading-5 tracking-[0.28px] transition-colors duration-150 hover:text-foreground"
              onClick={handleClear}
              type="button"
            >
              Clear
            </button>
            <span
              aria-hidden="true"
              className="mx-1.5 h-5 w-px shrink-0 bg-muted-foreground/50"
            />
          </>
        ) : null}

        <button
          aria-controls={answerId}
          aria-expanded={expanded}
          aria-label={askButtonLabel(isNewQuestion || !hasAnswer, expanded)}
          className="focus-ring -my-2 -mr-2 shrink-0 rounded-none p-2 disabled:cursor-default disabled:opacity-40"
          disabled={isAsking || !(isNewQuestion || hasAnswer)}
          type="submit"
        >
          <Plus
            className={cn(
              "pointer-events-none size-5 text-foreground transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none dark:text-accent-green",
              expanded && "rotate-45"
            )}
          />
        </button>
      </form>
      <div
        aria-busy={isAsking}
        aria-live="polite"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        id={answerId}
        inert={!expanded}
      >
        <div className="overflow-hidden">
          {hasAnswer ? (
            <div className="body-text pb-4 text-muted-foreground">
              <AskAnswer answer={answer} error={error} isAsking={isAsking} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
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
            <h2
              className="font-normal text-4xl text-foreground leading-tight tracking-[-0.24px] md:text-5xl"
              data-inline-edit
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="body-text max-w-xl text-muted-foreground"
              data-inline-edit
            >
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
        <p className="text-base text-muted-foreground" data-inline-edit>
          {link.title}
        </p>
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
    <section className="block-section" id="faq">
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
              <div className="grid content-start gap-4">
                <FaqList faqs={activeFaqs} key={accordionKey} />
                <AskItem
                  animationDelay={`${Math.min(activeFaqs.length, 8) * 45}ms`}
                />
              </div>
              {link && <FaqContactLink link={link} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
