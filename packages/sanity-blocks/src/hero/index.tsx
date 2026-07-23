import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import {
  getImageDimensions,
  SanityImage,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";

import type { HeroVideoData, HeroVideoVariant } from "./hero-video";
import { HeroVideo } from "./hero-video";

export type { HeroVideoData, HeroVideoVariant } from "./hero-video";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  isFirst?: boolean;
  richText?: RichTextValue;
  title?: string | null;
  video?: HeroVideoData | null;
}

const bannerFill = "absolute inset-0 size-full";

const POSTER_WIDTH = 1440;
/** Fallback shape for a poster whose asset id carries no dimensions. */
const POSTER_FALLBACK_HEIGHT = 913;

function HeroPosterFrame({
  variant,
  isCap = false,
}: Readonly<{ variant: HeroVideoVariant; isCap?: boolean }>) {
  if (!variant.poster?.id) {
    return null;
  }

  const dimensions = getImageDimensions(variant.poster);
  const height = dimensions
    ? Math.round(POSTER_WIDTH / dimensions.aspectRatio)
    : POSTER_FALLBACK_HEIGHT;

  return (
    <SanityImage
      alt=""
      className={cn(bannerFill, "rounded-none! object-cover object-[50%_45%]")}
      fetchPriority={isCap ? undefined : "high"}
      height={height}
      image={variant.poster}
      loading={isCap ? "lazy" : "eager"}
      width={POSTER_WIDTH}
    />
  );
}

/**
 * The video's first frame, painted under the clip so the load is covered.
 * Split light/dark in CSS because this renders on the server, where the
 * active theme isn't known.
 */
function HeroPosterMedia({
  light,
  dark,
  isCap = false,
}: Readonly<{
  light: HeroVideoVariant;
  dark?: HeroVideoVariant | null;
  isCap?: boolean;
}>) {
  return (
    <>
      <div className={cn(bannerFill, dark && "dark:hidden")}>
        <HeroPosterFrame isCap={isCap} variant={light} />
      </div>
      {dark && (
        <div className={cn(bannerFill, "hidden dark:block")}>
          <HeroPosterFrame isCap={isCap} variant={dark} />
        </div>
      )}
    </>
  );
}

function hasPoster(variant?: HeroVideoVariant | null): boolean {
  return Boolean(variant?.poster?.id);
}

export function HeroBlock({
  title,
  buttons,
  badge,
  richText,
  isFirst,
  video,
}: Readonly<HeroBlockProps>) {
  const lightPoster = hasPoster(video?.light) ? video?.light : null;
  const darkPoster = hasPoster(video?.dark) ? video?.dark : null;
  const posterLight = lightPoster ?? darkPoster;
  const posterDark = darkPoster ?? lightPoster;
  return (
    <section
      className="relative flex min-h-svh flex-col bg-background"
      id="hero"
    >
      {isFirst && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full h-64 select-none"
        >
          {posterLight && (
            <HeroPosterMedia dark={posterDark} isCap light={posterLight} />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-transparent to-background"
          />
        </div>
      )}

      <div className="hero-banner relative flex-1 overflow-hidden">
        {posterLight && (
          <HeroPosterMedia dark={posterDark} light={posterLight} />
        )}
        <HeroVideo className={bannerFill} video={video} />
      </div>

      <div className="container mt-8 pb-8 md:mt-10 md:pb-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="grid gap-5">
            <BlockEyebrow eyebrow={badge} />
            <h1 className="max-w-[827px] break-words font-normal text-4xl text-foreground leading-[1.1] tracking-[-0.24px] sm:text-5xl lg:text-[64px]">
              {title}
            </h1>
            <RichText
              className="body-text max-w-[633px] text-muted-foreground"
              richText={richText}
            />
          </div>
          <SanityButtons
            buttonClassName="h-auto w-full py-3 text-xl leading-8 sm:w-auto"
            buttons={buttons}
            className="gap-3 sm:flex-row lg:justify-end"
          />
        </div>
      </div>
    </section>
  );
}
