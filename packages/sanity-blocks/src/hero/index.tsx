import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { Badge } from "@workspace/ui/components/badge";

export interface HeroBlockProps {
  badge?: string | null;
  buttons?: ButtonProps[] | null;
  image?: SanityImageData | null;
  richText?: RichTextValue;
  title?: string | null;
}

function HeroGraphic() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto aspect-[720/525] w-full max-w-xl select-none bg-center bg-contain bg-no-repeat [background-image:url('/hero-artwork-light.svg')] dark:[background-image:url('/hero-artwork-dark.svg')]"
    />
  );
}

export function HeroBlock({
  title,
  buttons,
  badge,
  image,
  richText,
}: Readonly<HeroBlockProps>) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24" id="hero">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid justify-items-center gap-6 text-center lg:justify-items-start lg:text-left">
            {badge && (
              <Badge className="border-foreground" variant="secondary">
                {badge}
              </Badge>
            )}
            <div className="grid gap-6">
              <h1 className="max-w-xl text-balance font-medium text-5xl leading-[1.15] tracking-[-0.24px] md:text-6xl lg:text-7xl">
                {title}
              </h1>
              <RichText
                className="max-w-md text-balance text-lg text-muted-foreground leading-7"
                richText={richText}
              />
            </div>
            <SanityButtons
              buttonClassName="w-full sm:w-auto"
              buttons={buttons}
              className="grid w-full gap-3 sm:w-fit sm:grid-flow-col lg:justify-start"
            />
          </div>

          {image?.id ? (
            <div className="h-96 w-full">
              <SanityImage
                className="max-h-96 w-full rounded-3xl object-cover"
                fetchPriority="high"
                height={800}
                image={image}
                loading="eager"
                width={800}
              />
            </div>
          ) : (
            <HeroGraphic />
          )}
        </div>
      </div>
    </section>
  );
}
