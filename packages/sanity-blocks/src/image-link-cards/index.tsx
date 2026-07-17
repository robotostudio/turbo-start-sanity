import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import Link from "next/link";

export interface ImageLinkCard {
  _key: string;
  description?: string | null;
  href?: string | null;
  image?: SanityImageData | null;
  openInNewTab?: boolean | null;
  title?: string | null;
}

export interface ImageLinkCardsProps {
  cards?: ImageLinkCard[] | null;
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

function CTACard({ card }: Readonly<{ card: ImageLinkCard }>) {
  const { image, title, href, openInNewTab } = card;

  if (!href) {
    return null;
  }

  return (
    <Link
      className="group relative flex h-62 items-center justify-center overflow-hidden border border-border bg-muted transition-colors"
      href={href}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      <div className="absolute inset-0 text-foreground opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative">
        <span className="pointer-events-none absolute -top-3 -left-3 size-2 border-zinc-950 border-r border-b dark:border-accent-green" />
        <span className="pointer-events-none absolute -top-3 -right-3 size-2 border-zinc-950 border-b border-l dark:border-accent-green" />
        <span className="pointer-events-none absolute -bottom-3 -left-3 size-2 border-zinc-950 border-t border-r dark:border-accent-green" />
        <span className="pointer-events-none absolute -right-3 -bottom-3 size-2 border-zinc-950 border-t border-l dark:border-accent-green" />
        <span className="flex size-16 items-center justify-center bg-accent-green p-2 transition-transform duration-300 group-hover:scale-105">
          {image?.id && (
            <SanityImage
              className="pointer-events-none size-8 object-contain"
              height={64}
              image={image}
              loading="eager"
              width={64}
            />
          )}
        </span>
      </div>

      {title && (
        <span className="absolute bottom-1 left-1 bg-background px-2 py-1 font-mono text-base text-foreground uppercase">
          {title}
        </span>
      )}
    </Link>
  );
}

export function ImageLinkCards({
  richText,
  title,
  eyebrow,
  cards,
}: Readonly<ImageLinkCardsProps>) {
  return (
    <section className="py-12 md:py-20" id="image-link-cards">
      <div className="container">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-5 text-center">
            <BlockEyebrow eyebrow={eyebrow} />
            {title && (
              <h2 className="text-balance font-medium text-3xl tracking-tight md:text-5xl">
                {title}
              </h2>
            )}
            <RichText
              className="max-w-xl text-balance text-base text-muted-foreground md:text-lg"
              richText={richText}
            />
          </div>

          {Array.isArray(cards) && cards.length > 0 && (
            <div className="mt-12 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
              {cards.map((card) => (
                <CTACard card={card} key={card._key} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
