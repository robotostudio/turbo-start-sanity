import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { SanityIcon } from "@workspace/sanity-blocks/internal/sanity-icon";
import { cn } from "@workspace/tailwind-config/utils";

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

function FeatureCardItem({
  card,
  index,
}: Readonly<{ card: FeatureCard; index: number }>) {
  const { icon, title, richText } = card;
  // On the lg 3-column grid: keep the top border on rows after the first so a
  // wrapped second row gets a horizontal divider, and skip the left border on
  // each row's first column so there's no stray outer-left line.
  const isFirstRow = index < 3;
  const isFirstColumn = index % 3 === 0;
  return (
    <div
      className={cn(
        "group flex min-w-0 flex-col justify-between gap-12 border-border border-t bg-background p-8 text-foreground transition-colors hover:bg-accent-green hover:text-accent-green-foreground md:min-h-72 md:gap-16",
        isFirstRow && "lg:border-t-0",
        !isFirstColumn && "lg:border-l"
      )}
    >
      {icon &&
        (index === 0 ? (
          // Bleeding-edge card: the icon chip sits INSIDE a dot band that rings
          // it on the left/top/bottom (via `pl-2.5` + vertical centering) and
          // continues across to the card's right edge (`-mr-8` cancels the
          // card's right padding). The `bg-background` chip masks the dots
          // directly behind it, leaving the surrounding ring visible.
          <div className="-mr-8 flex h-12 items-center bg-grid-dots-fine bg-left pl-2.5 text-zinc-800 group-hover:text-accent-green-foreground dark:text-zinc-50 dark:group-hover:text-accent-green-foreground">
            <span className="flex size-7 shrink-0 items-center justify-center bg-background transition-colors group-hover:bg-accent-green">
              <SanityIcon className="size-6" icon={icon} />
            </span>
          </div>
        ) : (
          // Other cards: a ring of dots surrounding the centered icon chip.
          // Dots are ALWAYS visible (currentColor); hover only swaps the color
          // (card + chip go accent-green) — the dot layout never changes.
          <div className="flex size-12 items-center justify-center bg-grid-dots-fine bg-center text-zinc-800 group-hover:text-accent-green-foreground dark:text-zinc-50 dark:group-hover:text-accent-green-foreground">
            <span className="flex size-7 items-center justify-center bg-background transition-colors group-hover:bg-accent-green">
              <SanityIcon className="size-6" icon={icon} />
            </span>
          </div>
        ))}
      <div className="flex min-w-0 flex-col gap-2">
        {title ? (
          <h3 className="text-balance break-words font-medium text-xl leading-8">
            {title}
          </h3>
        ) : null}
        <RichText
          className="break-words text-pretty font-normal text-lg text-muted-foreground leading-7 transition-colors group-hover:text-accent-green-foreground/80"
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
            {title ? (
              <h2 className="max-w-2xl text-balance font-normal text-4xl text-foreground leading-tight tracking-[-0.24px] md:text-5xl">
                {title}
              </h2>
            ) : null}
            <RichText
              className="max-w-xl text-pretty text-lg text-muted-foreground leading-7"
              richText={richText}
            />
          </div>
        </div>
      </div>
      <div className="mt-12 bg-grid-dots-md p-[30px] text-zinc-800 md:mt-16 md:p-[45px] dark:text-zinc-50">
        <div className="grid lg:grid-cols-3">
          {cards?.map((card, index) => (
            <FeatureCardItem
              card={card}
              index={index}
              key={card._key ?? `FeatureCard-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
