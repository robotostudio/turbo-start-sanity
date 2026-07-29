import {
  resolveAssetId,
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";

import { normalizedLogoHeight } from "../internal/logo-height";

export interface ShowcaseGridItem {
  _key: string;
  siteName?: string | null;
  url?: string | null;
  category?: string | null;
  screenshot?: SanityImageData | null;
  attributionLogo?: SanityImageData | null;
  featured?: boolean | null;
}

export interface ShowcaseGridProps {
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
  category: string | null;
  screenshot: ImageSource;
  logo: SanityImageData | null;
};

// Gate on the same canonical validity as SanityImage/resolveAssetId; the local
// type guard only exists to narrow away null/undefined for the call sites.
function hasValidAssetId(
  image: SanityImageData | null | undefined
): image is SanityImageData {
  return resolveAssetId(image) !== null;
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
    category: item.category?.trim() || null,
    screenshot,
    logo: hasValidAssetId(item.attributionLogo) ? item.attributionLogo : null,
  };
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

function AttributionMark({ item }: Readonly<{ item: CardView }>) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden bg-zinc-900 text-white">
      {item.logo ? (
        <SanityImage
          alt={`${item.name} logo`}
          className="size-full object-contain"
          height={24}
          image={item.logo}
          width={24}
        />
      ) : (
        <span className="font-medium text-sm leading-none">
          {item.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function ScreenshotImage({
  screenshot,
  name,
  sizes,
  className,
  loading,
}: Readonly<{
  screenshot: ImageSource;
  name: string;
  sizes: string;
  className?: string;
  loading?: "eager" | "lazy";
}>) {
  if (screenshot.kind === "sanity") {
    return (
      <SanityImage
        alt={`${name} website screenshot`}
        className={cn("absolute inset-0 size-full object-cover", className)}
        height={810}
        image={screenshot.image}
        loading={loading}
        sizes={sizes}
        width={1440}
      />
    );
  }
  return null;
}

function FocusBrackets() {
  const corner =
    "absolute size-2 border-accent-green-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100";
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(corner, "-top-3 -left-3 border-r border-b")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-top-3 -right-3 border-b border-l")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-bottom-3 -left-3 border-t border-r")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-right-3 -bottom-3 border-t border-l")}
      />
    </>
  );
}

function ShowcaseHeader({
  title,
  description,
}: Readonly<{
  title?: string | null;
  description?: string | null;
}>) {
  if (!(title || description)) {
    return null;
  }
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
      {title ? (
        <h2 className="block-title text-balance lg:text-[64px] lg:leading-[1.1]">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="body-text max-w-xl text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FeaturedBanner({
  featured,
  side = "left",
}: Readonly<{ featured: CardView; side?: "left" | "right" }>) {
  const panelRight = side === "right";
  const clickable = Boolean(featured.url);

  const chip = (
    <span className="relative flex items-center justify-center bg-background px-4 py-4 text-foreground group-hover:bg-black group-hover:text-white group-focus-visible:bg-black group-focus-visible:text-white">
      {clickable ? <FocusBrackets /> : null}
      {featured.logo ? (
        <AttributionLogo
          base={28}
          className="invert group-hover:invert-0 group-focus-visible:invert-0 dark:invert-0"
          item={featured}
        />
      ) : (
        <span className="font-normal text-lg tracking-[-0.015em]">
          {featured.name}
        </span>
      )}
    </span>
  );

  const panel = (
    <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-grid-dots p-8 text-foreground sm:min-h-80 lg:min-h-0 lg:p-14">
      {clickable ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-accent-green opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      ) : null}
      {chip}
    </div>
  );

  const screenshot = (
    <div
      className="relative aspect-video w-full overflow-hidden bg-muted before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-28 before:bg-gradient-to-b before:from-black/60 before:to-transparent before:content-['']"
      data-nav-contrast="dark"
    >
      <ScreenshotImage
        loading="lazy"
        name={featured.name}
        screenshot={featured.screenshot}
        sizes="(min-width: 1024px) 66vw, 100vw"
      />
    </div>
  );

  const inner = (
    <div
      className={cn(
        "grid gap-2 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]",
        panelRight && "lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]"
      )}
    >
      {panelRight ? (
        <>
          <div className="order-last lg:order-none">{screenshot}</div>
          {panel}
        </>
      ) : (
        <>
          {panel}
          {screenshot}
        </>
      )}
    </div>
  );

  return (
    <div className="container">
      {clickable && featured.url ? (
        <a
          className="group block outline-none focus-ring"
          href={featured.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="sr-only">{`Visit ${featured.name}`}</span>
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

function CardCaption({
  item,
  clickable,
}: Readonly<{ item: CardView; clickable: boolean }>) {
  const hoverText =
    clickable &&
    "group-hover:text-accent-green-foreground group-focus-visible:text-accent-green-foreground";
  return (
    <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-background px-4 py-3">
      {clickable ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-bottom scale-y-0 bg-accent-green group-hover:scale-y-100 group-focus-visible:scale-y-100"
        />
      ) : null}

      <div className="relative flex min-w-0 items-center gap-2">
        <AttributionMark item={item} />
        <span
          className={cn(
            "truncate font-normal text-base text-foreground leading-6 tracking-[-0.015em]",
            hoverText
          )}
        >
          {item.name}
        </span>
      </div>

      {item.category ? (
        <span
          className={cn(
            "relative shrink-0 font-normal text-base text-muted-foreground leading-6",
            hoverText
          )}
        >
          {item.category}
        </span>
      ) : null}
    </div>
  );
}

function ShowcaseCard({ item }: Readonly<{ item: CardView }>) {
  const clickable = Boolean(item.url);

  const body = (
    <div className="flex flex-col bg-background">
      <div
        className="relative aspect-video w-full overflow-hidden bg-muted before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-28 before:bg-gradient-to-b before:from-black/60 before:to-transparent before:content-['']"
        data-nav-contrast="dark"
      >
        <ScreenshotImage
          loading="lazy"
          name={item.name}
          screenshot={item.screenshot}
          sizes="(min-width: 640px) 50vw, 100vw"
        />
      </div>
      <CardCaption clickable={clickable} item={item} />
    </div>
  );

  if (clickable && item.url) {
    return (
      <a
        className="group flex flex-col bg-grid-dots p-4 text-foreground outline-none focus-ring"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="sr-only">{`Visit ${item.name}`}</span>
        {body}
      </a>
    );
  }

  return (
    <article className="group flex flex-col bg-grid-dots p-4 text-foreground">
      {body}
    </article>
  );
}

export function ShowcaseGrid({
  title,
  description,
  items,
}: Readonly<ShowcaseGridProps>) {
  const cmsItems = items ?? [];
  const label = title?.trim() || "Showcase";
  const allViews = cmsItems.map(cmsToView);

  const explicitFeaturedKeys = new Set(
    cmsItems.filter((item) => item.featured).map((item) => item._key)
  );
  const featuredItems =
    explicitFeaturedKeys.size > 0
      ? allViews.filter((item) => explicitFeaturedKeys.has(item.id))
      : allViews.slice(0, 1);
  const featuredIds = new Set(featuredItems.map((item) => item.id));
  const cards = allViews.filter((item) => !featuredIds.has(item.id));

  const [leadBanner, ...trailingBanners] = featuredItems;

  if (featuredItems.length === 0) {
    return (
      <section className="bg-background pt-16 pb-24" id="showcase">
        {title ? null : <h2 className="sr-only">{label}</h2>}
        <div className="container">
          <ShowcaseHeader description={description} title={title} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background pt-16 pb-24" id="showcase">
      {title ? null : <h2 className="sr-only">{label}</h2>}
      <div className="flex flex-col gap-16">
        <div className="container">
          <ShowcaseHeader description={description} title={title} />
        </div>

        {leadBanner ? (
          <FeaturedBanner featured={leadBanner} side="left" />
        ) : null}

        {cards.length > 0 ? (
          <div className="mx-auto w-full max-w-[90rem] sm:px-2">
            <div className="grid gap-y-12 sm:grid-cols-2 sm:gap-x-8">
              {cards.map((item) => (
                <ShowcaseCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        ) : null}

        {trailingBanners.map((item, index) => (
          <FeaturedBanner
            featured={item}
            key={item.id}
            side={index % 2 === 0 ? "right" : "left"}
          />
        ))}
      </div>
    </section>
  );
}
