import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import { Badge } from "@workspace/ui/components/badge";

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
      cellClassName="flex h-16 items-center justify-center bg-background p-2 md:w-[165px] md:p-4"
      height={24}
      href={logo.href}
      image={logo.image}
      imageClassName="h-8 w-auto max-w-full object-contain md:h-6 dark:invert"
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
          <div className="max-w-lg space-y-5">
            {eyebrow && <Badge variant="secondary">{eyebrow}</Badge>}
            <h2 className="text-balance font-normal text-3xl text-foreground leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <div className="text-lg text-muted-foreground">
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
              <div className="grid w-full grid-cols-3 gap-[15.6px] bg-grid-dots-dense p-[15.6px] text-foreground md:w-auto">
                {logos.map((logo) => (
                  <UsedByTeamsLogo key={logo._key} logo={logo} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-20 sm:mt-28 lg:mt-[136px]">
          <SanityButtons
            buttonClassName="h-auto flex-1 px-8 py-4 font-normal text-xl sm:text-2xl lg:px-[72px] lg:py-6 lg:text-5xl lg:leading-[60px]"
            buttons={buttons}
            className="flex w-full flex-col gap-4 sm:flex-row"
          />
        </div>
      </div>
    </section>
  );
}
