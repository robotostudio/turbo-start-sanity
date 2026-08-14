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

import { HeroFold } from "./hero-fold";
import type { HeroVideoData, HeroVideoVariant } from "./hero-video";
import { HeroVideo } from "./hero-video";

export type { HeroVideoData, HeroVideoVariant } from "./hero-video";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  /**
   * Visual editing attribute for the block. Only the leading hero needs it:
   * its page-builder wrapper is `display: contents` so the banner can pin
   * against the grid, and a box-less element measures 0x0 in the overlay.
   * Both boxes below carry it instead — the overlay only treats an element as
   * drag-sortable when it resolves to an array-member path, so a half without
   * it would resolve to the page-builder array itself and refuse to drag.
   */
  dataSanity?: string;
  isFirst?: boolean;
  richText?: RichTextValue;
  title?: string | null;
  video?: HeroVideoData | null;
}

const bannerFill = "absolute inset-0 size-full";

const POSTER_WIDTH = 1440;

function posterOf(variant?: HeroVideoVariant | null): SanityImageData | null {
  return variant?.poster?.id ? variant.poster : null;
}

function HeroPoster({
  className,
  eager,
  poster,
}: Readonly<{
  className?: string;
  eager?: boolean;
  poster: SanityImageData;
}>) {
  const dimensions = getImageDimensions(poster);
  return (
    <SanityImage
      alt=""
      className={cn(
        bannerFill,
        "rounded-none! object-cover object-[50%_45%]",
        className
      )}
      fetchPriority={eager ? "high" : undefined}
      height={
        dimensions
          ? Math.round(POSTER_WIDTH / dimensions.aspectRatio)
          : undefined
      }
      image={poster}
      loading={eager ? "eager" : "lazy"}
      width={POSTER_WIDTH}
    />
  );
}

/**
 * The video's first frame, painted under the clip so the load is covered.
 * Split light/dark in CSS because this renders on the server, where the
 * active theme isn't known.
 */
function HeroPosters({
  eager,
  video,
}: Readonly<{ eager?: boolean; video?: HeroVideoData | null }>) {
  const light = posterOf(video?.light) ?? posterOf(video?.dark);
  const dark = posterOf(video?.dark) ?? light;
  if (!light) {
    return null;
  }

  const split = dark !== null && dark !== light;

  return (
    <>
      <HeroPoster
        className={split ? "dark:hidden" : undefined}
        eager={eager}
        poster={light}
      />
      {split && <HeroPoster className="hidden dark:block" poster={dark} />}
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
        <h1 className="hero-enter max-w-[827px] break-words font-normal text-4xl text-foreground leading-[1.1] tracking-[-0.24px] sm:text-5xl lg:text-[64px]">
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
        className="relative z-0 h-[calc(100svh-var(--hero-copy))] overflow-hidden bg-background lg:sticky lg:top-0"
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
