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
    <div className="flex flex-col gap-8 bg-muted px-8 py-6 md:min-h-72">
      {icon && (
        <span className="flex size-12 items-center justify-center bg-accent-green text-accent-green-foreground">
          <SanityIcon className="size-6" icon={icon} />
        </span>
      )}
      <div className="flex flex-col gap-3">
        {title ? (
          <h3 className="font-medium text-xl leading-8">{title}</h3>
        ) : null}
        <RichText
          className="text-balance font-normal text-lg text-muted-foreground leading-7"
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
    <section className="py-12 md:py-20" id="features">
      <div className="container">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-5 text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            {title ? (
              <h2 className="font-medium text-3xl tracking-tight md:text-5xl">
                {title}
              </h2>
            ) : null}
            <RichText
              className="max-w-xl text-balance text-base text-muted-foreground md:text-lg"
              richText={richText}
            />
          </div>
        </div>
        <div className="mx-auto mt-14 grid gap-6 md:mt-16 lg:grid-cols-3 lg:gap-12">
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
