import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";
import type { ButtonProps } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import type { SanityImageData } from "@workspace/sanity-blocks/internal/sanity-image";
import type { CSSProperties } from "react";

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
  const baseHeight = normalizedLogoHeight(logo.image, {
    base: 26,
    min: 18,
    max: 30,
  });
  const desktopHeight = normalizedLogoHeight(logo.image, {
    base: 30,
    min: 21,
    max: 34,
  });
  return (
    <LogoLinkCell
      cellClassName="flex items-center justify-center bg-background px-2 py-3 lg:w-[165px]"
      height={24}
      href={logo.href}
      image={logo.image}
      imageClassName="h-[var(--logo-h)] w-auto max-w-full object-contain md:h-[var(--logo-h-md)] dark:invert"
      imageStyle={
        {
          "--logo-h": `${baseHeight}px`,
          "--logo-h-md": `${desktopHeight}px`,
        } as CSSProperties
      }
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
          <div className="flex max-w-[690px] flex-col items-start gap-6">
            <BlockEyebrow eyebrow={eyebrow} />
            <div className="flex flex-col items-start gap-4">
              <h2 className="font-normal text-3xl text-foreground leading-tight tracking-[-0.24px] md:text-4xl lg:text-5xl">
                {title}
              </h2>
              <div className="body-text text-muted-foreground">
                <RichText richText={richText} />
              </div>
            </div>
          </div>
          {hasLogos && (
            // -mx-4 mirrors the container's px-4 so the dotted grid bleeds
            // edge-to-edge when stacked below lg; the title re-adds the inset.
            <div className="-mx-4 flex flex-col items-start gap-2 lg:mx-0">
              {usedByTeams?.title && (
                <p className="px-4 font-light font-mono text-sm text-zinc-600 uppercase leading-6 tracking-[0.24px] lg:px-0 dark:text-zinc-300">
                  {usedByTeams.title}
                </p>
              )}
              <div className="grid w-full grid-cols-3 gap-[15.6px] bg-grid-dots p-[15.6px] text-zinc-800 lg:w-auto dark:text-zinc-50">
                {logos.map((logo) => (
                  <UsedByTeamsLogo key={logo._key} logo={logo} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-20 pb-10 sm:mt-28 sm:pb-14 lg:mt-[136px] lg:pb-[72px]">
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
