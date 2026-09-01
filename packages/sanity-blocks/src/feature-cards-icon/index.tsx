import { BlockHeader } from "@workspace/sanity-blocks/internal/block-header";
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
    <div className="group flex min-w-0 transform-gpu flex-col gap-12 bg-background p-[31.2px] text-foreground transition-colors duration-200 ease-out hover:bg-accent-green hover:text-accent-green-foreground lg:row-span-3 lg:grid lg:min-h-72 lg:grid-rows-subgrid lg:gap-0">
      {icon && (
        <div className="-mr-[31.2px] relative flex h-12 items-center lg:row-start-1 lg:mb-12">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 left-12 bg-grid-dots bg-left text-accent-green-foreground opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
          />
          <div className="relative flex size-12 items-center justify-center bg-grid-dots bg-center text-zinc-800 transition-colors duration-200 ease-out group-hover:text-accent-green-foreground dark:text-zinc-50 dark:group-hover:text-accent-green-foreground">
            <span className="flex size-7 items-center justify-center bg-background transition-colors duration-200 ease-out group-hover:bg-accent-green">
              <SanityIcon className="size-6" icon={icon} />
            </span>
          </div>
        </div>
      )}
      {/* Dissolved on lg so heading and body land in the shared subgrid rows. */}
      <div className="flex min-w-0 flex-col gap-2 lg:contents">
        {title ? (
          <h3 className="text-balance break-words font-medium text-xl leading-8 lg:row-start-2 lg:mb-2 lg:min-w-0">
            {title}
          </h3>
        ) : null}
        <RichText
          className="body-text break-words text-muted-foreground transition-colors duration-200 ease-out group-hover:text-accent-green-foreground/80 lg:row-start-3 lg:min-w-0"
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
    <section className="block-section" id="features">
      <div className="container">
        <BlockHeader eyebrow={eyebrow} title={title}>
          <RichText
            className="body-text max-w-xl text-muted-foreground"
            richText={richText}
          />
        </BlockHeader>
        <div className="bleed-x mt-12 bg-grid-dots p-[var(--container-px,0.5rem)] text-zinc-800 md:mt-16 lg:p-[42px] dark:text-zinc-50 [background-size:7px_7px]">
          <div className="grid gap-[var(--container-px,0.5rem)] lg:grid-cols-3 lg:gap-0">
            {cards?.map((card, index) => (
              <FeatureCardItem
                card={card}
                key={card._key ?? `FeatureCard-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
