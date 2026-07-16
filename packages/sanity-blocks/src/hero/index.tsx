import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import { Badge } from "@workspace/ui/components/badge";
import Image from "next/image";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  image?: SanityImageData | null;
  richText?: RichTextValue;
  title?: string | null;
}

export function HeroBlock({
  title,
  buttons,
  badge,
  image,
  richText,
}: Readonly<HeroBlockProps>) {
  // Full-bleed banner sized to the Figma "image container" (1460×533 at 1440px
  // width): the tall 2014:1276 artwork aspect forces the height to clamp to the
  // Figma banner height (534px, matching the intrinsic height below) on every
  // desktop width, so the banner stays a stable fixed height regardless of the
  // badge. On narrow viewports it scales down proportionally, floored by min-h
  // so it never collapses. object-cover crops the artwork to fill.
  const imageHeight = "aspect-[2014/1276] max-h-[500px] min-h-[180px]";
  return (
    <section
      className="relative overflow-hidden bg-background pb-10 md:pb-14"
      id="hero"
    >
      <div className="w-full overflow-hidden">
        {image?.id ? (
          <SanityImage
            className={cn(
              imageHeight,
              "w-full rounded-none! object-cover object-center"
            )}
            fetchPriority="high"
            height={534}
            image={image}
            loading="eager"
            width={1440}
          />
        ) : (
          <>
            <div className={cn(imageHeight, "relative w-full dark:hidden")}>
              <Image
                alt=""
                aria-hidden="true"
                className="rounded-none! object-cover object-center"
                fill
                sizes="100vw"
                src="/hero-fallback-light.png"
              />
            </div>
            <div
              className={cn(imageHeight, "relative hidden w-full dark:block")}
            >
              <Image
                alt=""
                aria-hidden="true"
                className="rounded-none! object-cover object-center"
                fill
                sizes="100vw"
                src="/hero-fallback-dark.png"
              />
            </div>
          </>
        )}
      </div>

      <div className="container mt-8 md:mt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
          <div className="grid gap-5">
            {badge && (
              <Badge className="w-fit border-foreground" variant="secondary">
                {badge}
              </Badge>
            )}
            <h1 className="max-w-[827px] break-words font-normal text-4xl text-foreground leading-[1.1] tracking-[-0.24px] sm:text-5xl lg:text-[64px]">
              {title}
            </h1>
            <RichText
              className="max-w-[633px] text-base text-muted-foreground leading-6"
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
