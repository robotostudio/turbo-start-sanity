import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import { ArrowUpRight } from "lucide-react";

import { normalizedLogoHeight } from "../internal/logo-height";

export interface ShowcaseGridItem {
  _key: string;
  siteName?: string | null;
  url?: string | null;
  screenshot?: SanityImageData | null;
  attributionLogo?: SanityImageData | null;
  builtByRoboto?: boolean | null;
  featured?: boolean | null;
}

export interface ShowcaseGridProps {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  items?: ShowcaseGridItem[] | null;
}

type ImageSource =
  | { kind: "sanity"; image: SanityImageData }
  | { kind: "none" };

type CardView = {
  id: string;
  name: string;
  url: string | null;
  screenshot: ImageSource;
  logo: SanityImageData | null;
  builtByRoboto: boolean;
};

function hasValidAssetId<T extends { id?: string | null }>(
  image: T | null | undefined
): image is T {
  if (typeof image?.id !== "string") {
    return false;
  }
  return image.id.replace(/^drafts\./, "").startsWith("image-");
}

function cmsToView(item: ShowcaseGridItem): CardView {
  const name = item.siteName ?? "Untitled";

  const screenshot: ImageSource = hasValidAssetId(item.screenshot)
    ? { kind: "sanity", image: item.screenshot }
    : { kind: "none" };

  return {
    id: item._key,
    name,
    url: item.url ?? null,
    screenshot,
    logo: hasValidAssetId(item.attributionLogo) ? item.attributionLogo : null,
    builtByRoboto: item.builtByRoboto ?? false,
  };
}

function RobotoIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 14 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.8333 8.16L12.7593 6.24V2.4L10.3518 0H4.81481L2.40741 2.4H10.3518V6.24H4.79315L3.37037 7.6584H2.40741V2.4L0 4.8V12H2.40741V8.1384H6.72148L10.3518 12H13.2407L9.87037 8.16H10.8333Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AttributionLogo({
  item,
  base = 20,
  className,
}: Readonly<{ item: CardView; base?: number; className?: string }>) {
  if (!item.logo) {
    return null;
  }
  return (
    <SanityImage
      alt={`${item.name} logo`}
      className={cn("w-auto shrink-0 object-contain", className)}
      height={24}
      image={item.logo}
      style={{
        height: normalizedLogoHeight(item.logo, {
          base,
          min: Math.round(base * 0.8),
          max: Math.round(base * 1.2),
        }),
      }}
      width={96}
    />
  );
}

function ScreenshotImage({
  screenshot,
  name,
  sizes,
  className,
}: Readonly<{
  screenshot: ImageSource;
  name: string;
  sizes: string;
  className?: string;
}>) {
  if (screenshot.kind === "sanity") {
    return (
      <SanityImage
        alt={`${name} website screenshot`}
        className={cn("absolute inset-0 size-full object-cover", className)}
        height={810}
        image={screenshot.image}
        sizes={sizes}
        width={1440}
      />
    );
  }
  return null;
}


function CardBadge({ builtByRoboto }: Readonly<{ builtByRoboto: boolean }>) {
  if (builtByRoboto) {
    return (
      <span className="flex h-6 shrink-0 items-center gap-2 bg-muted px-2 py-1.5 font-mono text-muted-foreground text-xs uppercase tracking-[0.24px]">
        <RobotoIcon className="h-3 w-auto shrink-0" />
        Built by Roboto
      </span>
    );
  }
  return (
    <span className="flex h-6 shrink-0 items-center border border-border px-2 py-1.5 font-mono text-muted-foreground text-xs uppercase tracking-[0.24px]">
      Community
    </span>
  );
}


function ShowcaseWordmark({ word }: Readonly<{ word: string }>) {
  const type =
    "block whitespace-nowrap font-medium text-[clamp(3.5rem,15vw,13rem)] uppercase leading-[0.9] tracking-[-0.03em] text-foreground";
  const crisp = "linear-gradient(to right, #000 0 44%, transparent 66%)";
  const blurBand =
    "linear-gradient(to right, transparent 40%, #000 60%, #000 74%, transparent 92%)";
  const dotDissolve =
    "radial-gradient(circle at center, #000 0 0.6px, transparent 1px), linear-gradient(to right, transparent 58%, #000 80%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className="relative w-full select-none overflow-hidden"
    >
      <span
        className={type}
        style={{ maskImage: crisp, WebkitMaskImage: crisp }}
      >
        {word}
      </span>
      <span
        className={cn("absolute inset-0", type)}
        style={{
          filter: "blur(6px)",
          maskImage: blurBand,
          WebkitMaskImage: blurBand,
        }}
      >
        {word}
      </span>
      <span
        className={cn("absolute inset-0", type)}
        style={{
          maskImage: dotDissolve,
          WebkitMaskImage: dotDissolve,
          maskSize: "5.2px 5.2px, 100% 100%",
          WebkitMaskSize: "5.2px 5.2px, 100% 100%",
          maskRepeat: "round, no-repeat",
          WebkitMaskRepeat: "round, no-repeat",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      >
        {word}
      </span>
    </div>
  );
}

function ShowcaseHeader({
  wordmark,
  title,
  description,
}: Readonly<{
  wordmark: string;
  title?: string | null;
  description?: string | null;
}>) {
  return (
    <div className="flex flex-col gap-6">
      <ShowcaseWordmark word={wordmark} />
      {title || description ? (
        <div className="flex flex-col items-start gap-5">
          {title ? <h2 className="max-w-3xl block-title">{title}</h2> : null}
          {description ? (
            <p className="body-text max-w-xl text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The featured build: a branding panel (the site's logo on the dot lattice)
 * beside a full-width screenshot — the split from the design, stacking on small
 * screens.
 */
function FeaturedBanner({ featured }: Readonly<{ featured: CardView }>) {
  return (
    <div className="container">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="relative flex min-h-40 items-center justify-center bg-grid-dots p-8 text-zinc-800 lg:min-h-0 lg:p-14 dark:text-zinc-50">
          {featured.logo ? (
            <span className="bg-background px-3 py-2">
              {/* The mark is a monochrome (black) asset; invert it in dark mode
                  so it reads light on the dark chip instead of black-on-black. */}
              <AttributionLogo
                base={28}
                className="dark:invert"
                item={featured}
              />
            </span>
          ) : (
            <span className="bg-background px-4 py-2 font-normal text-foreground text-lg tracking-[-0.015em]">
              {featured.name}
            </span>
          )}
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <ScreenshotImage
            name={featured.name}
            screenshot={featured.screenshot}
            sizes="(min-width: 1024px) 66vw, 100vw"
          />
        </div>
      </div>
    </div>
  );
}

function CardBody({
  item,
  clickable,
}: Readonly<{ item: CardView; clickable: boolean }>) {
  return (
    <>
      <div className="bg-card p-6 sm:p-10 lg:p-14">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <ScreenshotImage
            className={cn(
              clickable &&
                "transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none"
            )}
            name={item.name}
            screenshot={item.screenshot}
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        </div>
      </div>

      {/* One caption row. On hover of a clickable card it repaints to the
          accent bar in place and the badge crossfades to a Visit affordance —
          no second label appears beneath it. */}
      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 px-4 py-3.5 transition-[margin,background-color] duration-200 ease-out motion-reduce:transition-none",
          clickable &&
            "group-hover:mt-0 group-hover:bg-accent-green group-focus-visible:mt-0 group-focus-visible:bg-accent-green"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <AttributionLogo item={item} />
          <span
            className={cn(
              "truncate font-normal text-base text-foreground leading-6 tracking-[-0.015em] transition-colors duration-200 ease-out motion-reduce:transition-none",
              clickable &&
                "group-hover:text-accent-green-foreground group-focus-visible:text-accent-green-foreground"
            )}
          >
            {item.name}
          </span>
        </div>

        {clickable ? (
          <span className="relative flex shrink-0 items-center">
            <span
              aria-hidden="true"
              className="flex items-center transition-opacity duration-200 ease-out group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none"
            >
              <CardBadge builtByRoboto={item.builtByRoboto} />
            </span>
            <span
              aria-hidden="true"
              className="absolute right-0 flex items-center gap-1.5 font-mono text-accent-green-foreground text-xs uppercase tracking-wide opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
              Visit
              <ArrowUpRight size={14} />
            </span>
          </span>
        ) : (
          <CardBadge builtByRoboto={item.builtByRoboto} />
        )}
      </div>
    </>
  );
}

function ShowcaseCard({ item }: Readonly<{ item: CardView }>) {
  const clickable = Boolean(item.url && item.builtByRoboto);

  if (clickable && item.url) {
    return (
      <a
        className="group flex flex-col outline-none focus-ring"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="sr-only">{`Visit ${item.name}`}</span>
        <CardBody clickable item={item} />
      </a>
    );
  }

  return (
    <article className="flex flex-col">
      <CardBody clickable={false} item={item} />
    </article>
  );
}

export function ShowcaseGrid({
  eyebrow,
  title,
  description,
  items,
}: Readonly<ShowcaseGridProps>) {
  const cmsItems = items ?? [];
  const featuredItem = cmsItems.find((item) => item.featured) ?? cmsItems[0];
  const wordmark = eyebrow?.trim() || "Showcase";

  if (!featuredItem) {
    return (
      <section className="bg-background pt-8 pb-24" id="showcase">
        {title ? null : <h2 className="sr-only">{wordmark}</h2>}
        <div className="container">
          <ShowcaseHeader
            description={description}
            title={title}
            wordmark={wordmark}
          />
        </div>
      </section>
    );
  }

  const featured = cmsToView(featuredItem);
  const cards = cmsItems.filter((item) => item !== featuredItem).map(cmsToView);

  return (
    <section className="bg-background pt-8 pb-24" id="showcase">
      {title ? null : <h2 className="sr-only">{wordmark}</h2>}
      <div className="flex flex-col gap-16">
        <div className="container">
          <ShowcaseHeader
            description={description}
            title={title}
            wordmark={wordmark}
          />
        </div>
        <FeaturedBanner featured={featured} />
        {cards.length > 0 ? (
          <div className="container">
            <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 sm:gap-y-16">
              {cards.map((item) => (
                <ShowcaseCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
