import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Image from "next/image";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  image?: SanityImageData | null;
  isFirst?: boolean;
  richText?: RichTextValue;
  title?: string | null;
}

const bannerFill = "absolute inset-0 size-full";

function HeroBannerMedia({
  image,
  isCap = false,
}: {
  image?: SanityImageData | null;
  isCap?: boolean;
}) {
  if (image?.id) {
    return (
      <SanityImage
        alt={isCap ? "" : undefined}
        className={cn(bannerFill, "rounded-none! object-cover object-center")}
        fetchPriority={isCap ? undefined : "high"}
        height={534}
        image={image}
        loading={isCap ? "lazy" : "eager"}
        width={1440}
      />
    );
  }

  return (
    <>
      <div className={cn(bannerFill, "dark:hidden")}>
        <Image
          alt=""
          aria-hidden="true"
          className="rounded-none! object-cover object-center"
          fill
          loading={isCap ? "lazy" : undefined}
          sizes="100vw"
          src="/hero-fallback-light.png"
        />
      </div>
      <div className={cn(bannerFill, "hidden dark:block")}>
        <Image
          alt=""
          aria-hidden="true"
          className="rounded-none! object-cover object-center"
          fill
          loading={isCap ? "lazy" : undefined}
          sizes="100vw"
          src="/hero-fallback-dark.png"
        />
      </div>
    </>
  );
}

export function HeroBlock({
  title,
  buttons,
  badge,
  image,
  richText,
  isFirst,
}: Readonly<HeroBlockProps>) {
  return (
    <section
      className="relative flex min-h-svh flex-col bg-background"
      id="hero"
    >
      {isFirst && (
        <div
          aria-hidden="true"
          className="-scale-y-100 pointer-events-none absolute inset-x-0 bottom-full h-64 select-none"
        >
          <HeroBannerMedia image={image} isCap />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-transparent to-background"
          />
        </div>
      )}
      <div className="relative min-h-[220px] w-full flex-1 overflow-hidden">
        <HeroBannerMedia image={image} />
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
