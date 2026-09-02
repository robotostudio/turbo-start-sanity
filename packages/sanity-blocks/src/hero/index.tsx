import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import {
  getImageDimensions,
  SanityImage,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";

import { muxPlaybackId, muxThumbnailUrl } from "../internal/mux";
import type { HeroVideoData, HeroVideoVariant } from "./hero-video";
import { HeroVideo } from "./hero-video";
import { isMuxPath, mediaTypeOf } from "./media-type";

export type { HeroVideoData, HeroVideoVariant } from "./hero-video";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  dataSanity?: string;
  isFirst?: boolean;
  richText?: RichTextValue;
  title?: string | null;
  video?: HeroVideoData | null;
}

const bannerFill = "absolute inset-0 size-full";

const POSTER_WIDTH = 1440;

/** `key` compares themes: these objects are rebuilt each render, so identity cannot. */
type HeroStill = {
  image?: SanityImageData;
  key: string;
  url?: string;
};

function stillOf(variant?: HeroVideoVariant | null): HeroStill | null {
  if (variant?.poster?.id) {
    return { image: variant.poster, key: variant.poster.id };
  }
  // Only the Mux path may borrow Mux's generated still. A hero served from the
  // Sanity CDN must not reach image.mux.com for its poster, or the two
  // delivery paths stop being measurable against each other.
  if (!isMuxPath(mediaTypeOf(variant))) {
    return null;
  }
  const url = muxThumbnailUrl(
    muxPlaybackId(variant?.mux),
    variant?.mux?.thumbTime,
    POSTER_WIDTH
  );
  return url ? { key: url, url } : null;
}

function HeroPoster({
  className,
  eager,
  fill = true,
  still,
}: Readonly<{
  className?: string;
  eager?: boolean;
  /** Off for the fold's mirror: a `top: 0` would over-constrain its own
   * bottom/height and pin the flip to the wrong edge. */
  fill?: boolean;
  still: HeroStill;
}>) {
  const shared = cn(
    fill && bannerFill,
    "rounded-none! object-cover object-[50%_45%]",
    className
  );

  if (still.url) {
    return (
      // biome-ignore lint/performance/noImgElement: Mux serves this already sized and encoded from its own CDN; next/image would add a proxy hop for nothing.
      <img
        alt=""
        className={shared}
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
        src={still.url}
      />
    );
  }

  const image = still.image as SanityImageData;
  const dimensions = getImageDimensions(image);
  return (
    <SanityImage
      alt=""
      className={shared}
      fetchPriority={eager ? "high" : undefined}
      height={
        dimensions
          ? Math.round(POSTER_WIDTH / dimensions.aspectRatio)
          : undefined
      }
      image={image}
      loading={eager ? "eager" : "lazy"}
      width={POSTER_WIDTH}
    />
  );
}

function HeroFold({ video }: Readonly<{ video?: HeroVideoData | null }>) {
  const light = stillOf(video?.light) ?? stillOf(video?.dark);
  const dark = stillOf(video?.dark) ?? light;
  if (!light) {
    return null;
  }

  const split = dark !== null && dark.key !== light.key;
  const mirror =
    "absolute inset-x-0 bottom-0 h-[calc(100svh-var(--hero-copy))] w-full scale-y-[-1] rounded-none! object-cover object-[50%_45%] blur-[16px]";

  return (
    <div
      aria-hidden="true"
      className="hero-park -top-[var(--hero-fold,0px)] absolute inset-x-0 z-0 h-[calc(var(--hero-fold,0px)+4rem)] overflow-hidden bg-background lg:fixed lg:top-0 lg:h-[var(--hero-fold)]"
      id="hero-fold"
    >
      <HeroPoster
        className={cn(mirror, split && "dark:hidden")}
        fill={false}
        still={light}
      />
      {split && dark && (
        <HeroPoster
          className={cn(mirror, "hidden dark:block")}
          fill={false}
          still={dark}
        />
      )}
    </div>
  );
}

/**
 * The still under the clip, and the whole background when there is no video.
 * Split light/dark in CSS: this renders on the server, which has no theme.
 */
function HeroPosters({
  eager,
  video,
}: Readonly<{ eager?: boolean; video?: HeroVideoData | null }>) {
  const light = stillOf(video?.light) ?? stillOf(video?.dark);
  const dark = stillOf(video?.dark) ?? light;
  if (!light) {
    return null;
  }

  const split = dark !== null && dark.key !== light.key;

  return (
    <>
      <HeroPoster
        className={split ? "dark:hidden" : undefined}
        eager={eager}
        still={light}
      />
      {/* Never eager: the server cannot know the theme, so preloading both
          halves of a CSS-split pair always wastes one full-size download and
          earns a "preloaded but not used" warning. The light one carries the
          priority; the dark one arrives a beat later in dark mode. */}
      {split && <HeroPoster className="hidden dark:block" still={dark} />}
    </>
  );
}

export function HeroBlock({
  title,
  buttons,
  badge,
  dataSanity,
  richText,
  isFirst,
  video,
}: Readonly<HeroBlockProps>) {
  const banner = (
    <>
      <HeroPosters eager video={video} />
      <HeroVideo className={bannerFill} video={video} />
    </>
  );

  const copy = (
    <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
      <div className="grid gap-5">
        <BlockEyebrow eyebrow={badge} />
        <h1 className="hero-enter max-w-[827px] text-pretty break-words font-normal text-4xl text-foreground leading-[1.1] tracking-[-0.24px] sm:text-5xl lg:text-[64px]">
          {title}
        </h1>
        <RichText
          className="body-text hero-enter max-w-[633px] text-muted-foreground [animation-delay:80ms]"
          richText={richText}
        />
      </div>
      <SanityButtons
        buttonClassName="h-auto w-full px-5 py-2 text-xl leading-8 sm:w-auto"
        buttons={buttons}
        className="hero-enter gap-3 sm:flex-row lg:justify-end [animation-delay:160ms]"
      />
    </div>
  );

  if (!isFirst) {
    return (
      <section
        className="relative flex min-h-svh flex-col bg-background"
        id="hero"
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">{banner}</div>
        <div className="relative z-10 bg-background pt-6 pb-8 md:pt-8 md:pb-12">
          {copy}
        </div>
      </section>
    );
  }

  return (
    <>
      <HeroFold video={video} />
      <div
        className="hero-park relative z-0 h-[calc(100svh-var(--hero-copy))] overflow-hidden bg-background lg:sticky lg:top-0"
        data-sanity={dataSanity}
        id="hero"
      >
        <div className="hero-blur absolute inset-0">{banner}</div>
      </div>
      <div
        className="relative z-10 bg-background pt-6 pb-8 md:pt-8 md:pb-12"
        data-sanity={dataSanity}
      >
        {copy}
      </div>
    </>
  );
}
