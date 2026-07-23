import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";

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

type LogoSource =
  | { kind: "sanity"; image: SanityImageData }
  | { kind: "url"; src: string }
  | { kind: "initials"; initials: string; className: string };

type CardView = {
  id: string;
  name: string;
  url: string | null;
  screenshot: ImageSource;
  logo: LogoSource;
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

function cmsToView(item: ShowcaseGridItem): CardView {
  const name = item.siteName ?? "Untitled";
  const initialsLogo: LogoSource = {
    kind: "initials",
    initials: getInitials(name),
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
    id: item._key,
    name,
    url: item.url ?? null,
    screenshot,
    logo,
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
        {/* biome-ignore lint/performance/noImgElement: external redirect URL (google favicon) — next/image can't handle the redirect */}
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

function ShowcaseCardName({ item }: Readonly<{ item: CardView }>) {
  if (item.url && item.builtByRoboto) {
    return (
      <a
        className="text-base text-zinc-900 leading-6 outline-none dark:text-zinc-50"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="absolute inset-0 z-10" />
        {item.name}
      </a>
    );
  }
  return (
    <span className="text-base text-zinc-900 leading-6 dark:text-zinc-50">
      {item.name}
    </span>
  );
}

function ShowcaseCard({ item }: Readonly<{ item: CardView }>) {
  const clickable = Boolean(item.url && item.builtByRoboto);
  return (
    <article
      className={cn(
        "flex flex-col gap-2",
        clickable && "group focus-ring-within relative"
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
          <AttributionLogo logo={item.logo} name={item.name} />
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

function ShowcaseHeader({
  eyebrow,
  title,
  description,
}: Readonly<{
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
}>) {
  return (
    <div className="flex flex-col items-start gap-6">
      <BlockEyebrow eyebrow={eyebrow} />
      {title ? <h2 className="max-w-3xl block-title">{title}</h2> : null}
      {description ? (
        <p className="body-text max-w-xl text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ShowcaseHero({
  eyebrow,
  title,
  description,
  featured,
}: Readonly<{
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  featured: CardView;
}>) {
  return (
    <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-stretch">
      <div className="flex flex-col justify-end gap-10">
        <ShowcaseHeader
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
      </div>
      <div className="bg-grid-dots bg-size-[5.5px_5.5px] p-7 text-zinc-800 dark:text-zinc-50">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <ScreenshotImage
            name={featured.name}
            screenshot={featured.screenshot}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 px-4 py-2 text-foreground dark:bg-zinc-900">
          <AttributionLogo logo={featured.logo} name={featured.name} />
          <span className="flex-1 font-medium text-base text-foreground">
            {featured.name}
          </span>
          <span className="text-muted-foreground text-sm">Featured</span>
        </div>
      </div>
    </div>
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

  if (!featuredItem) {
    return (
      <section className="bg-background pt-8 pb-24" id="showcase">
        <div className="container flex flex-col gap-10">
          <ShowcaseHeader
            description={description}
            eyebrow={eyebrow}
            title={title}
          />
        </div>
      </section>
    );
  }

  const featured = cmsToView(featuredItem);
  const cards = cmsItems.filter((item) => item !== featuredItem).map(cmsToView);

  return (
    <section className="bg-background pt-8 pb-24" id="showcase">
      <div className="container flex flex-col gap-24">
        <ShowcaseHero
          description={description}
          eyebrow={eyebrow}
          featured={featured}
          title={title}
        />
        {cards.length > 0 ? (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3">
            {cards.map((item) => (
              <ShowcaseCard item={item} key={item.id} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
