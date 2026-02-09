import { Badge } from "@workspace/ui/components/badge";

import { RichText } from "@/components/elements/rich-text";
import type { PagebuilderType } from "@/types";

export type RichTextBlockProps = PagebuilderType<"richTextBlock">;

export function RichTextBlock({
  richText,
  title,
  eyebrow,
}: RichTextBlockProps) {
  return (
    <section className="my-6 md:my-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex w-full flex-col items-center">
          <div className="flex flex-col items-center space-y-4 text-center sm:space-y-6 md:text-center">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            {title && (
              <h2 className="font-semibold text-3xl md:text-5xl">{title}</h2>
            )}
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          <RichText richText={richText} />
        </div>
      </div>
    </section>
  );
}
