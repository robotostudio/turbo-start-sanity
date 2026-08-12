import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";

import { LogoLinkCell } from "../internal/logo-link-cell";

export interface CtaUsedByTeamsLogo {
  _key: string;
  href?: string | null;
  image?: SanityImageData | null;
  openInNewTab?: boolean | null;
}

export interface CtaUsedByTeams {
  logos?: CtaUsedByTeamsLogo[] | null;
  title?: string | null;
}

export interface CtaBlockProps {
  buttons?: ButtonProps[] | null;
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
  usedByTeams?: CtaUsedByTeams | null;
}

function UsedByTeamsLogo({ logo }: Readonly<{ logo: CtaUsedByTeamsLogo }>) {
  return (
    <LogoLinkCell
      cellClassName="flex items-center justify-center bg-background px-2 py-4"
      height={24}
      href={logo.href}
      image={logo.image}
      imageClassName="h-6 w-auto max-w-full object-contain md:h-[22px] dark:invert"
      openInNewTab={logo.openInNewTab}
      width={156}
    />
  );
}

export function CTABlock({
  richText,
  title,
  eyebrow,
  buttons,
  usedByTeams,
}: Readonly<CtaBlockProps>) {
  const logos = usedByTeams?.logos?.filter((logo) => logo.image?.id) ?? [];
  const hasLogos = logos.length > 0;

  return (
    <section className="block-section" id="cta">
      <div className="container">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="flex max-w-[690px] flex-col items-start gap-6 lg:min-w-0">
            <BlockEyebrow eyebrow={eyebrow} />
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-normal text-3xl text-foreground leading-tight tracking-[-0.24px] md:text-4xl lg:text-5xl">
                {title}
              </h2>
              <RichText
                className="body-text prose-p:text-base prose-p:leading-6 text-muted-foreground sm:prose-p:text-lg sm:prose-p:leading-7"
                richText={richText}
              />
            </div>
          </div>
          {hasLogos && (
            // The logo card keeps its designed size at lg (557px → 165px
            // cells); the text column beside it is the flexible one — it
            // shrinks and wraps, so the card never overflows its dotted frame.
            <div className="bleed-x flex flex-col items-start gap-2 lg:mx-0 lg:w-[557px] lg:shrink-0">
              {usedByTeams?.title && (
                <p className="px-4 font-light font-mono text-sm text-zinc-600 uppercase leading-6 tracking-[0.24px] lg:px-0 dark:text-zinc-300">
                  {usedByTeams.title}
                </p>
              )}
              <div className="grid w-full grid-cols-3 gap-[15.6px] bg-grid-dots [background-size:5.3px_5.2px] p-[15.6px] text-zinc-800 dark:text-zinc-50">
                {logos.map((logo) => (
                  <UsedByTeamsLogo key={logo._key} logo={logo} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="my-20 pb-20 sm:my-28 sm:pb-28 lg:my-34 lg:pb-34">
          <SanityButtons
            buttonClassName="h-auto px-8 py-4 font-normal text-xl sm:text-2xl lg:px-24 lg:py-6 lg:text-5xl lg:leading-[60px]"
            buttons={buttons}
            className="flex w-full flex-wrap justify-center gap-4"
          />
        </div>
      </div>
    </section>
  );
}
