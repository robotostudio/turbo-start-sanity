import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { Badge } from "@workspace/ui/components/badge";

import { normalizedLogoHeight } from "../internal/logo-height";
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
      cellClassName="flex h-12 items-center justify-center bg-background p-2 md:w-[165px] md:p-3"
      height={24}
      href={logo.href}
      image={logo.image}
      imageClassName="w-auto max-w-full object-contain dark:invert"
      imageStyle={{
        height: normalizedLogoHeight(logo.image, { base: 26, min: 18, max: 30 }),
      }}
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
    <section className="py-20 sm:py-28 lg:py-[136px]" id="cta">
      <div className="container">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-[690px] space-y-5">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            <h2 className="font-normal text-3xl text-foreground leading-tight tracking-[-0.24px] md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <div className="text-lg text-muted-foreground leading-7">
              <RichText richText={richText} />
            </div>
          </div>
          {hasLogos && (
            <div className="flex flex-col items-start gap-2">
              {usedByTeams?.title && (
                <p className="font-mono text-muted-foreground text-sm uppercase tracking-wide">
                  {usedByTeams.title}
                </p>
              )}
              {/* `bg-grid-dots-dense` uses `background-repeat: round`, which anchors
                  the tiled dot lattice at the top-left origin. On this small,
                  fractionally-sized box the sub-pixel rounding of the tile
                  positions biases the top/left rows ~0.5px toward the edge, so
                  they render nearly flush and read as half-cut. Nudging the
                  pattern down-right by half a pixel restores the intended
                  centered phase on every edge without touching the shared
                  utility (used by the social grid, showcase, newsletter). */}
              <div className="grid w-full grid-cols-3 gap-[15.6px] bg-grid-dots-dense p-[15.6px] text-zinc-800 [background-position:0.5px_0.5px] [background-size:5.3px_5.3px] md:w-auto dark:text-zinc-50">
                {logos.map((logo) => (
                  <UsedByTeamsLogo key={logo._key} logo={logo} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-20 sm:mt-28 lg:mt-[136px]">
          <SanityButtons
            buttonClassName="h-auto grow px-8 py-4 font-normal text-xl sm:text-2xl lg:px-[72px] lg:py-6 lg:text-5xl lg:leading-[60px]"
            buttons={buttons}
            className="flex w-full flex-wrap gap-4"
          />
        </div>
      </div>
    </section>
  );
}
