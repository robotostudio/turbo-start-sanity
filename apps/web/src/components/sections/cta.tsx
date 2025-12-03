import { Badge } from "@workspace/ui/components/badge";

import type { PagebuilderType } from "@/types";

import { RichText } from "../elements/rich-text";
import { SanityButtons } from "../elements/sanity-buttons";

export type CTABlockProps = PagebuilderType<"cta">;

export function CTABlock({ richText, title, eyebrow, buttons }: CTABlockProps) {
  return (
    <section className="my-6 md:my-16" id="features">
      <div className="container mx-auto px-4 md:px-8">
        <div className="rounded-3xl bg-muted px-4 py-16">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            {eyebrow && (
              <Badge
                className="bg-zinc-200 dark:text-black"
                variant="secondary"
              >
                {eyebrow}
              </Badge>
            )}
            <h2 className="text-balance font-semibold text-3xl md:text-5xl">
              {title}
            </h2>
            <div className="text-lg text-muted-foreground">
              <RichText className="text-balance" richText={richText} />
            </div>
            <div className="flex justify-center">
              <SanityButtons
                buttonClassName="w-full sm:w-auto"
                buttons={buttons}
                className="mb-8 grid w-full gap-2 sm:w-fit sm:grid-flow-col lg:justify-start"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
