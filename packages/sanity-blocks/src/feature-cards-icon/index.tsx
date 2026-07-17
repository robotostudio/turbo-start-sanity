import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { SanityIcon } from "@workspace/sanity-blocks/internal/sanity-icon";

export interface FeatureCard {
  _key?: string | null;
  icon?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

export interface FeatureCardsIconProps {
  cards?: FeatureCard[] | null;
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

function FeatureCardItem({ card }: Readonly<{ card: FeatureCard }>) {
  const { icon, title, richText } = card;
  return (
    <div className="group flex min-w-0 flex-col justify-between gap-12 border-border border-t bg-background p-[31.2px] text-foreground transition-colors first:border-t-0 hover:bg-accent-green hover:text-accent-green-foreground md:min-h-72 md:gap-16 lg:border-t-0 lg:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n+4)]:border-t">
      {/* -mr-[31.2px] cancels the card's right padding so the strip reaches
          the card edge. bg-grid-dots tiles with background-repeat: round,
          which self-heals partial dots per element; the pitch-quantized
          padding (multiples of 5.2px) keeps the card and outer-frame
          lattices in step. The strip starts at left-12 — exactly the
          plate's width — so the two lattices never overlap. */}
      {icon && (
        <div className="-mr-[31.2px] relative flex h-12 items-center">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 left-12 bg-grid-dots bg-left text-accent-green-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <div className="relative flex size-12 items-center justify-center bg-grid-dots bg-center text-zinc-800 group-hover:text-accent-green-foreground dark:text-zinc-50 dark:group-hover:text-accent-green-foreground">
            <span className="flex size-7 items-center justify-center bg-background transition-colors group-hover:bg-accent-green">
              <SanityIcon className="size-6" icon={icon} />
            </span>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-2">
        {title ? (
          <h3 className="text-balance break-words font-medium text-xl leading-8">
            {title}
          </h3>
        ) : null}
        <RichText
          className="body-text break-words text-muted-foreground transition-colors group-hover:text-accent-green-foreground/80"
          richText={richText}
        />
      </div>
    </div>
  );
}

export function FeatureCardsWithIcon({
  eyebrow,
  title,
  richText,
  cards,
}: Readonly<FeatureCardsIconProps>) {
  return (
    <section
      className="bg-background pt-20 pb-0 sm:pt-28 lg:pt-[136px]"
      id="features"
    >
      <div className="container">
        <div className="flex flex-col items-start gap-6">
          <BlockEyebrow eyebrow={eyebrow} />
          <div className="flex flex-col items-start gap-5">
            {title ? <h2 className="max-w-2xl block-title">{title}</h2> : null}
            <RichText
              className="body-text max-w-xl text-muted-foreground"
              richText={richText}
            />
          </div>
        </div>
      </div>
      <div className="mt-12 bg-grid-dots p-[31.2px] text-zinc-800 md:mt-16 dark:text-zinc-50">
        <div className="grid bg-background lg:grid-cols-3">
          {cards?.map((card, index) => (
            <FeatureCardItem
              card={card}
              key={card._key ?? `FeatureCard-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
