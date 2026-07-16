import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import { RobotoIcon } from "@/components/icons";
import type { ShowcaseItemData, ShowcasePageData } from "@/types";

// A normalized view model derived from CMS data, so the exact same
// markup/classes render every card. A screenshot may be absent (no valid
// asset), and an attribution logo falls back to initials when missing.
type ImageSource =
  | { kind: "sanity"; image: SanityImageData }
  | { kind: "none" };

type LogoSource =
  | { kind: "sanity"; image: SanityImageData }
  | { kind: "url"; src: string }
  | { kind: "initials"; initials: string; className: string };

type CardView = {
  id: string;
  name: string;
  attributionName: string;
  url: string | null;
  screenshot: ImageSource;
  logo: LogoSource;
  builtByRoboto: boolean;
};

// A usable Sanity image id is the asset ref, e.g. `image-<hash>-<dims>-<ext>`.
// Malformed values (a missing/empty ref, or an invalid one like a `drafts.`
// prefixed id from a broken field) must NOT reach SanityImage — it throws
// "Could not parse image ID" and takes the whole page down. Guard here so bad
// data degrades to initials / no screenshot instead of crashing.
function hasValidAssetId<T extends { id?: string | null }>(
  image: T | null | undefined
): image is T {
  if (typeof image?.id !== "string") {
    return false;
  }
  // Tolerate the stray `drafts.` prefix a media-library selection can add;
  // SanityImage normalizes it too. Anything that still isn't an `image-…` ref
  // (missing/empty/garbage) falls back to initials / no screenshot.
  return image.id.replace(/^drafts\./, "").startsWith("image-");
}

// Fall back to a favicon for the item's domain when no attribution logo was
// uploaded. Returns null when the URL can't be parsed so callers can drop back
// to initials.
function faviconFor(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
}

function cmsToView(item: ShowcaseItemData): CardView {
  const attributionName = item.attributionName ?? item.siteName ?? "Untitled";
  const initialsLogo: LogoSource = {
    kind: "initials",
    initials: getInitials(attributionName),
    className: "bg-foreground text-background",
  };
  const faviconUrl = item.url ? faviconFor(item.url) : null;
  // Uploaded asset wins; otherwise fall back to a fetched favicon when a URL is
  // present, and finally to initials.
  let logo: LogoSource;
  if (hasValidAssetId(item.attributionLogo)) {
    logo = { kind: "sanity", image: item.attributionLogo };
  } else if (faviconUrl) {
    logo = { kind: "url", src: faviconUrl };
  } else {
    logo = initialsLogo;
  }

  // Only an uploaded Sanity asset renders a screenshot; anything else shows the
  // empty placeholder.
  const screenshot: ImageSource = hasValidAssetId(item.screenshot)
    ? { kind: "sanity", image: item.screenshot }
    : { kind: "none" };

  return {
    id: item._id,
    name: item.siteName ?? "Untitled",
    attributionName,
    url: item.url ?? null,
    screenshot,
    logo,
    builtByRoboto: item.builtByRoboto ?? false,
  };
}

function ScreenshotImage({
  screenshot,
  name,
  sizes,
}: Readonly<{
  screenshot: ImageSource;
  name: string;
  sizes: string;
}>) {
  if (screenshot.kind === "sanity") {
    return (
      <SanityImage
        alt={`${name} website screenshot`}
        className="absolute inset-0 size-full object-cover"
        height={720}
        image={screenshot.image}
        sizes={sizes}
        width={1280}
      />
    );
  }
  return null;
}

function AttributionLogo({
  logo,
  name,
}: Readonly<{ logo: LogoSource; name: string }>) {
  if (logo.kind === "sanity") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden">
        <SanityImage
          alt={`${name} logo`}
          className="size-6 object-contain"
          height={24}
          image={logo.image}
          width={24}
        />
      </span>
    );
  }
  if (logo.kind === "url") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden">
        {/* biome-ignore lint/performance/noImgElement: external redirect URL (microlink/google favicon) — next/image can't handle the redirect */}
        <img
          alt={`${name} logo`}
          className="size-6 object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={logo.src}
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center font-medium text-xs uppercase",
        logo.className
      )}
    >
      {logo.initials}
    </span>
  );
}

function BuiltByRobotoBadge() {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 bg-muted px-2 py-1.5">
      <RobotoIcon className="h-3 w-auto shrink-0 text-muted-foreground" />
      <span className="font-light font-mono text-muted-foreground text-xs uppercase tracking-wide">
        Built by Roboto
      </span>
    </span>
  );
}

function ShowcaseBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            className="focus-ring text-muted-foreground transition-colors hover:text-foreground"
            href="/"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted-foreground">
          /
        </li>
        <li className="text-foreground">Showcase</li>
      </ol>
    </nav>
  );
}

function ShowcaseCardName({ item }: Readonly<{ item: CardView }>) {
  if (item.url) {
    return (
      <a
        className="text-base text-zinc-900 leading-6 outline-none dark:text-zinc-50"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="absolute inset-0 z-10" />
        {item.attributionName}
      </a>
    );
  }
  return (
    <span className="text-base text-zinc-900 leading-6 dark:text-zinc-50">
      {item.attributionName}
    </span>
  );
}

function ShowcaseCard({ item }: Readonly<{ item: CardView }>) {
  return (
    <article
      className={cn(
        "flex flex-col gap-2",
        item.url && "group focus-ring-within relative"
      )}
    >
      <div className="relative aspect-video min-h-[249px] w-full overflow-hidden bg-muted">
        <ScreenshotImage
          name={item.name}
          screenshot={item.screenshot}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div
        className={cn(
          "flex items-center gap-1",
          item.builtByRoboto && "justify-between"
        )}
      >
        <div className="flex items-center gap-1">
          <AttributionLogo logo={item.logo} name={item.attributionName} />
          <ShowcaseCardName item={item} />
        </div>
        {item.builtByRoboto ? (
          <span className="relative z-20">
            <BuiltByRobotoBadge />
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ShowcaseHero({
  headline,
  description,
  featured,
}: Readonly<{
  headline: string;
  description: string;
  featured: CardView;
}>) {
  return (
    <section className="grid gap-12 lg:grid-cols-2 lg:items-stretch">
      <div className="flex flex-col justify-between gap-10">
        <ShowcaseBreadcrumb />
        <div className="flex flex-col gap-6">
          <h1 className="text-balance font-normal text-4xl leading-tight tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="max-w-lg text-base text-muted-foreground leading-6">
            {description}
          </p>
        </div>
      </div>
      <div className="bg-grid-dots-dense p-7 text-zinc-800 [background-size:6.6px_6.6px] dark:text-zinc-50">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <ScreenshotImage
            name={featured.name}
            screenshot={featured.screenshot}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 px-4 py-2 text-foreground dark:bg-zinc-900">
          <AttributionLogo
            logo={featured.logo}
            name={featured.attributionName}
          />
          <span className="flex-1 font-medium text-base text-foreground">
            {featured.name}
          </span>
          <span className="text-muted-foreground text-sm">Featured</span>
        </div>
      </div>
    </section>
  );
}

export function ShowcasePageContent({
  data,
  items,
}: Readonly<{
  data?: ShowcasePageData;
  items?: ShowcaseItemData[];
}>) {
  const cmsItems = items ?? [];
  const featuredItem = cmsItems.find((item) => item.featured) ?? cmsItems[0];

  const headline = data?.headline ?? "";
  const description = data?.description ?? "";

  // Nothing to show without CMS items — render just the hero copy rather
  // than crashing on a missing featured item.
  if (!featuredItem) {
    return (
      <main className="container flex flex-col gap-24 py-16">
        <section className="flex flex-col gap-6">
          <ShowcaseBreadcrumb />
          <h1 className="text-balance font-normal text-4xl leading-tight tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="max-w-lg text-base text-muted-foreground leading-6">
            {description}
          </p>
        </section>
      </main>
    );
  }

  const featured = cmsToView(featuredItem);
  // The featured item already headlines the hero, so drop it from the grid
  // below to avoid showing it twice.
  const cards = cmsItems.filter((item) => item !== featuredItem).map(cmsToView);

  return (
    <main className="container flex flex-col gap-24 py-16">
      <ShowcaseHero
        description={description}
        featured={featured}
        headline={headline}
      />
      <section className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => (
          <ShowcaseCard item={item} key={item.id} />
        ))}
      </section>
    </main>
  );
}
