import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
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

function RedditIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12c-.688 0-1.25.561-1.25 1.25 0 .687.562 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, ComponentType<IconProps>> = {
  reddit: RedditIcon,
  x: XIcon,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  slack: Slack,
};

function SocialCard({ social }: Readonly<{ social: SocialGridItem }>) {
  const { platform, label, logo, href, openInNewTab } = social;
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
            className="-top-[12px] -left-[12px] absolute size-2 border-accent-green-foreground border-r border-b opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-top-[12px] -right-[12px] absolute size-2 border-accent-green-foreground border-b border-l opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-bottom-[12px] -left-[12px] absolute size-2 border-accent-green-foreground border-t border-r opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="-right-[12px] -bottom-[12px] absolute size-2 border-accent-green-foreground border-t border-l opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          {media}
        </span>
      </div>
      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center bg-background p-1 font-light font-mono text-foreground text-sm uppercase leading-none transition-colors duration-200 group-hover:bg-black group-hover:text-white dark:group-hover:bg-background dark:group-hover:text-foreground">
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
        className="focus-ring-inset block"
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
    <section
      className="bg-background pt-20 pb-0 sm:pt-28 lg:pt-[136px]"
      id="socials"
    >
      <div className="mx-auto w-full max-w-6xl px-2">
        <div className="flex flex-col items-start gap-6">
          <BlockEyebrow eyebrow={eyebrow} />
          <div className="flex flex-col items-start gap-5">
            {title ? <h2 className="max-w-2xl block-title">{title}</h2> : null}
            {subtitle ? (
              <p className="body-text max-w-xl text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 bg-grid-dots bg-background bg-size-[6px_6px] text-zinc-800 sm:grid-cols-2 md:mt-16 lg:grid-cols-4 dark:text-zinc-50">
        {socials.map((social) => (
          <SocialCard key={social._key} social={social} />
        ))}
      </div>
    </section>
  );
}
