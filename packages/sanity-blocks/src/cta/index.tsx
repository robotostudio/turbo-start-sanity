import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { Badge } from "@workspace/ui/components/badge";

export interface CtaBlockProps {
  buttons?: ButtonProps[] | null;
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

export function CTABlock({
  richText,
  title,
  eyebrow,
  buttons,
}: Readonly<CtaBlockProps>) {
  return (
    <section className="py-12 md:py-20" id="cta">
      <div className="container">
        <div className="bg-muted px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            <h2 className="text-balance font-medium text-3xl tracking-tight md:text-5xl">
              {title}
            </h2>
            <div className="text-lg text-muted-foreground">
              <RichText className="text-balance" richText={richText} />
            </div>
            <div className="flex justify-center pt-2">
              <SanityButtons
                buttonClassName="w-full sm:w-auto"
                buttons={buttons}
                className="grid w-full gap-3 sm:w-fit sm:grid-flow-col"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
