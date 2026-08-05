import { BlockHeader } from "@workspace/sanity-blocks/internal/block-header";
import {
  RedditBrandIcon,
  XLogoIcon,
} from "@workspace/sanity-blocks/internal/icons";
import { sanitizeHref } from "@workspace/sanity-blocks/internal/safe-href";
import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import {
  ArrowRight,
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Slack,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

export interface SocialGridItem {
  _key: string;
  platform?: string | null;
  label?: string | null;
  logo?: SanityImageData | null;
  href?: string | null;
  openInNewTab?: boolean | null;
}

export interface SocialGridProps {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  socials?: SocialGridItem[] | null;
}

type IconProps = Readonly<{ className?: string }>;

const PLATFORM_ICONS: Record<string, ComponentType<IconProps>> = {
  reddit: RedditBrandIcon,
  x: XLogoIcon,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  slack: Slack,
};

function SocialCard({ social }: Readonly<{ social: SocialGridItem }>) {
  const { platform, label, logo, openInNewTab } = social;
  const href = sanitizeHref(social.href);
  const Icon = platform ? PLATFORM_ICONS[platform] : undefined;
  const displayLabel = label ?? platform ?? "";

  const iconMedia = Icon ? <Icon className="h-[42px] w-auto" /> : null;
  const media = logo?.id ? (
    <span className="flex h-[42px] shrink-0 items-center justify-center">
      <SanityImage
        className="h-[42px] w-auto max-w-full object-contain opacity-90 invert group-hover:invert-0 dark:invert-0"
        height={42}
        image={logo}
        width={47}
      />
    </span>
  ) : (
    iconMedia
  );

  const card = (
    <div className="group relative min-h-[260px] overflow-hidden text-foreground transition-colors hover:bg-accent-green sm:min-h-0 sm:aspect-[360/248]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="relative flex size-[100px] items-center justify-center bg-background text-foreground transition-colors duration-200 group-hover:bg-black group-hover:text-white">
          <span
            aria-hidden="true"
            className="-top-3 -left-3 absolute size-2 border-accent-green-foreground border-r border-b opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-top-3 -right-3 absolute size-2 border-accent-green-foreground border-b border-l opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-bottom-3 -left-3 absolute size-2 border-accent-green-foreground border-t border-r opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-right-3 -bottom-3 absolute size-2 border-accent-green-foreground border-t border-l opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          {media}
        </span>
      </div>
      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center bg-background px-[5px] py-[4px] font-light sm:py-[2.5px] font-mono text-foreground text-sm uppercase leading-none transition-colors duration-200 group-hover:bg-black group-hover:text-white dark:group-hover:bg-background dark:group-hover:text-foreground">
        <span className="min-w-0 truncate">{displayLabel}</span>
        {href ? (
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-0 shrink-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:ml-1 group-hover:w-4 group-hover:opacity-100"
          />
        ) : null}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        className="focus-ring-inset block focus-visible:[outline-style:solid]!"
        href={href}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        target={openInNewTab ? "_blank" : undefined}
      >
        {card}
      </Link>
    );
  }

  return card;
}

export function SocialGrid({
  eyebrow,
  title,
  subtitle,
  socials,
}: Readonly<SocialGridProps>) {
  if (!(Array.isArray(socials) && socials.length > 0)) {
    return null;
  }

  return (
    <section className="block-section" id="socials">
      <div className="mx-auto w-full max-w-6xl px-[var(--container-px,0.5rem)]">
        <BlockHeader eyebrow={eyebrow} title={title}>
          {subtitle ? (
            <p className="body-text max-w-xl text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </BlockHeader>
      </div>
      <div className="mt-12 grid grid-cols-1 bg-grid-dots bg-background bg-size-[5.7px_6px] text-zinc-800 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 dark:text-zinc-50">
        {socials.map((social) => (
          <SocialCard key={social._key} social={social} />
        ))}
      </div>
    </section>
  );
}
