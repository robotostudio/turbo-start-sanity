import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";

export interface HeroSplitProps {
  buttons?: ButtonProps[] | null;
  image?: SanityImageData | null;
  isFirst?: boolean;
  subtitle?: string | null;
  title?: string | null;
}

export function HeroSplit({
  buttons,
  image,
  isFirst,
  subtitle,
  title,
}: Readonly<HeroSplitProps>) {
  const Heading = isFirst ? "h1" : "h2";

  return (
    <section className="block-section" id="hero-split">
      <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="grid gap-5">
          {title && (
            <Heading
              className="max-w-[24ch] text-balance font-normal text-4xl text-foreground tracking-tight md:text-5xl lg:text-6xl"
              data-inline-edit
            >
              {title}
            </Heading>
          )}
          {subtitle && (
            <p
              className="body-text max-w-[48ch] text-muted-foreground"
              data-inline-edit
            >
              {subtitle}
            </p>
          )}
          <SanityButtons buttons={buttons} className="pt-3" />
        </div>
        {image?.id && (
          <div className="relative aspect-video overflow-hidden bg-muted outline-1 -outline-offset-1 outline-black/5 dark:outline-white/10">
            <SanityImage
              className="absolute inset-0 size-full object-cover"
              fetchPriority={isFirst ? "high" : undefined}
              height={900}
              image={image}
              loading={isFirst ? "eager" : "lazy"}
              mode="cover"
              sizes="(min-width: 64rem) 50vw, 100vw"
              width={1600}
            />
          </div>
        )}
      </div>
    </section>
  );
}
