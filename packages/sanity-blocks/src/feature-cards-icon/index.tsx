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
  highlighted,
  index,
}: Readonly<{ card: FeatureCard; highlighted: boolean; index: number }>) {
  const { icon, title, richText } = card;
  // On the lg 3-column grid: keep the top border on rows after the first so a
  // wrapped second row gets a horizontal divider, and skip the left border on
  // each row's first column so there's no stray outer-left line.
  const isFirstRow = index < 3;
  const isFirstColumn = index % 3 === 0;
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-12 p-8 md:min-h-72 md:gap-16",
        highlighted
          ? "bg-accent-green text-accent-green-foreground"
          : cn(
              "border-border border-t bg-background text-foreground",
              isFirstRow && "lg:border-t-0",
              !isFirstColumn && "lg:border-l"
            )
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center bg-grid-dots-md",
            highlighted
              ? "-mr-8 h-20 bg-left pl-[14px]"
              : "size-20 justify-center bg-center"
          )}
        >
          <span
            className={cn(
              "flex size-[52px] items-center justify-center",
              highlighted ? "bg-accent-green" : "bg-background"
            )}
          >
            <SanityIcon className="size-6" icon={icon} />
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {title ? (
          <h3 className="font-medium text-xl leading-8">{title}</h3>
        ) : null}
        <RichText
          className={cn(
            "text-pretty font-normal text-lg leading-7",
            highlighted
              ? "text-accent-green-foreground/80"
              : "text-muted-foreground"
          )}
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
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
              <span className="size-2 shrink-0 rounded-[1px] bg-accent-green" />
              <span className="font-mono text-muted-foreground text-sm uppercase leading-5 tracking-widest">
                {eyebrow}
              </span>
            </span>
          )}
          <div className="flex flex-col items-start gap-5">
            {title ? (
              <h2 className="max-w-2xl text-balance font-normal text-4xl text-foreground tracking-tight md:text-5xl">
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
      <div className="mt-12 bg-grid-dots-md p-[30px] md:mt-16 md:p-[45px]">
        <div className="grid lg:grid-cols-3">
          {cards?.map((card, index) => (
            <FeatureCardItem
              card={card}
              highlighted={index === 0}
              index={index}
              key={card._key ?? `FeatureCard-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
