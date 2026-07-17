import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";

export interface RichTextBlockProps {
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

export function RichTextBlock({
  richText,
  title,
  eyebrow,
}: Readonly<RichTextBlockProps>) {
  return (
    <section className="my-6 md:my-16">
      <div className="container">
        <div className="flex flex-col items-start gap-6">
          <BlockEyebrow eyebrow={eyebrow} />
          {title && <h2 className="max-w-2xl block-title">{title}</h2>}
        </div>
        {richText && (
          <div className="mt-8 max-w-3xl">
            <RichText richText={richText} />
          </div>
        )}
      </div>
    </section>
  );
}
