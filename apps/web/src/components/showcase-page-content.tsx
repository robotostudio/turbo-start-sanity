import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";

import { RobotoIcon } from "@/components/icons";
import type { ShowcaseItemData, ShowcasePageData } from "@/types";

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
  let logo: LogoSource;
  if (hasValidAssetId(item.attributionLogo)) {
    logo = { kind: "sanity", image: item.attributionLogo };
  } else if (faviconUrl) {
    logo = { kind: "url", src: faviconUrl };
  } else {
    logo = initialsLogo;
  }

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
      <div className="relative aspect-video w-full overflow-hidden bg-muted sm:min-h-[249px]">
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
    <section className="relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col justify-between gap-10">
          <ShowcaseBreadcrumb />
          <div className="flex flex-col gap-6">
            <h1 className="text-balance font-normal text-4xl leading-tight tracking-tight sm:text-5xl">
              {headline}
            </h1>
            <p className="body-text max-w-xl text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="bg-grid-dots p-7 text-zinc-800 dark:text-zinc-50 [background-size:5.3px_5.3px]">
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

  if (!featuredItem) {
    return (
      <main className="container flex flex-col gap-24 overflow-x-clip py-24">
        <section className="flex flex-col gap-6">
          <ShowcaseBreadcrumb />
          <h1 className="text-balance font-normal text-4xl leading-tight tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="body-text max-w-lg text-muted-foreground">
            {description}
          </p>
        </section>
      </main>
    );
  }

  const featured = cmsToView(featuredItem);
  const cards = cmsItems.filter((item) => item !== featuredItem).map(cmsToView);

  return (
    <main className="container flex flex-col gap-24 overflow-x-clip py-24">
      <ShowcaseHero
        description={description}
        featured={featured}
        headline={headline}
      />
      <section className="grid gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3">
        {cards.map((item) => (
          <ShowcaseCard item={item} key={item.id} />
        ))}
      </section>
    </main>
  );
}
