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

const imageHeight =
  "aspect-[4/3] min-h-[280px] object-cover object-center lg:aspect-[2014/1276] lg:max-h-[520px] lg:min-h-[180px]";

const compactImageHeight =
  "aspect-[16/9] min-h-[220px] object-cover object-center lg:aspect-[2014/860] lg:max-h-[430px] lg:min-h-[160px]";

function HeroBannerMedia({
  image,
  isCap = false,
  compact = false,
}: {
  image?: SanityImageData | null;
  isCap?: boolean;
  compact?: boolean;
}) {
  const heightClass = cn(compact ? compactImageHeight : imageHeight, "w-full");
  if (image?.id) {
    return (
      <SanityImage
        alt={isCap ? "" : undefined}
        className={cn(heightClass, "rounded-none! object-cover object-center")}
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
      <div className={cn(heightClass, "relative dark:hidden")}>
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
      <div className={cn(heightClass, "relative hidden dark:block")}>
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
  const compact = Boolean(badge?.trim());
  return (
    <section className="relative bg-background" id="hero">
      {isFirst && (
        <div
          aria-hidden="true"
          className="-scale-y-100 pointer-events-none absolute inset-x-0 bottom-full h-64 select-none"
        >
          <HeroBannerMedia compact={compact} image={image} isCap />
          {/* Fades the revealed artwork out the further the rubber-band pulls
              (this wrapper is flipped, so local top = the visible seam). */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-transparent to-background"
          />
        </div>
      )}
      <div className="w-full overflow-hidden">
        <HeroBannerMedia compact={compact} image={image} />
      </div>

      <div className="container mt-8 md:mt-10">
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
            buttonClassName="w-full sm:w-auto"
            buttons={buttons}
            className="gap-3 sm:flex-row lg:justify-end"
          />
        </div>
      </div>
    </section>
  );
}
