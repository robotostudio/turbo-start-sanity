import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import { SanityIcon } from "@workspace/sanity-blocks/internal/sanity-icon";
import { Badge } from "@workspace/ui/components/badge";

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
    <div className="rounded-3xl bg-accent p-8 md:min-h-75 md:p-8">
      {icon ? (
        <span className="mb-9 flex w-fit items-center justify-center rounded-full bg-background p-3 drop-shadow-xl">
          <SanityIcon icon={icon} />
        </span>
      ) : null}
      <div>
        {title ? (
         <h3 className="mb-2 font-medium text-lg md:text-2xl">{title}</h3>
        ) : null}
        <RichText
          className="text-balance font-normal text-black/90 text-sm leading-7 md:text-[16px] dark:text-neutral-300"
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
    <section className="my-6 md:my-16" id="features">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
           {title ? (
              <h2 className="font-semibold text-3xl md:text-5xl">{title}</h2>
            ) : null}
            <RichText
              className="max-w-3xl text-balance text-base md:text-lg"
              richText={richText}
            />
          </div>
        </div>
        <div className="mx-auto mt-20 grid gap-8 lg:grid-cols-3">
          {cards?.map((card) => (
            <FeatureCardItem
              card={card}
              key={`FeatureCard-${card?._key}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
