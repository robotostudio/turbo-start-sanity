import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
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

function CTACard({
  card,
  className,
}: Readonly<{
  card: ImageLinkCard;
  className?: string;
}>) {
  const { image, description, title, href, openInNewTab } = card;

  if (!href) {
    return null;
  }

  return (
    <Link
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl p-4 transition-colors md:p-8 xl:h-[400px]",
        className
      )}
      href={href}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      target={openInNewTab ? "_blank" : undefined}
    >
      {image?.id && (
        <div className="absolute inset-0 z-1 mix-blend-multiply">
          <SanityImage
            className="pointer-events-none object-cover opacity-40 grayscale duration-1000 group-hover:opacity-100 group-hover:transition-opacity dark:opacity-60 dark:saturate-200 dark:hover:opacity-[2]"
            height={1080}
            image={image}
            loading="eager"
            width={1920}
          />
        </div>
      )}
      <div className="z-2 mb-4 flex flex-col space-y-2 pt-64 duration-500 group-hover:top-8 xl:absolute xl:inset-x-8 xl:top-24">
        {title && (
          <h3 className="font-medium text-[#111827] text-xl dark:text-neutral-300">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-[#374151] text-sm transition-opacity delay-150 duration-300 xl:opacity-0 xl:group-hover:opacity-100 dark:text-neutral-300">
            {description}
          </p>
        )}
      </div>
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
    <section className="my-16" id="image-link-cards">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            {title && (
             <h2 className="text-balance font-semibold text-3xl md:text-5xl">
                {title}
              </h2>
            )}
            <RichText className="text-balance" richText={richText} />
          </div>

          {Array.isArray(cards) && cards.length > 0 && (
            <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-1">
              {cards.map((card, idx) => (
                <CTACard
                  card={card}
                  className={cn(
                    "bg-muted-foreground/10 dark:bg-zinc-800",
                    idx === 0 && "lg:rounded-r-none lg:rounded-l-3xl",
                    idx === cards.length - 1 &&
                      "lg:rounded-r-3xl lg:rounded-l-none",
                    idx !== 0 && idx !== cards.length - 1 && "lg:rounded-none"
                  )}
                  key={card._key}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
