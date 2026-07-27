import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@workspace/sanity/live";
import {
  queryFooterData,
  queryGlobalSeoSettings,
} from "@workspace/sanity/query";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@workspace/sanity/types";
import { normalizedLogoHeight } from "@workspace/sanity-blocks/internal/logo-height";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { Fragment } from "react";

import {
  FacebookIcon,
  InstagramBrandIcon,
  LinkedinBrandIcon,
  RedditBrandIcon,
  XBrandIcon,
  YoutubeIcon,
} from "@/components/icons";
import { FooterThemeToggle } from "./footer-theme-toggle";
import { Logo } from "./logo";

type SocialLinksProps = {
  data: NonNullable<QueryGlobalSeoSettingsResult>["socialLinks"];
};

type FooterProps = {
  data: NonNullable<QueryFooterDataResult>;
  settingsData: NonNullable<QueryGlobalSeoSettingsResult>;
};

export async function DynamicFooter() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedFooter perspective={perspective} stega={stega} />;
}

export async function CachedFooter({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [response, settingsResponse] = await Promise.all([
    sanityFetch({ query: queryFooterData, perspective, stega }),
    sanityFetch({ query: queryGlobalSeoSettings, perspective, stega }),
  ]);

  if (!(response?.data && settingsResponse?.data)) {
    return <FooterSkeleton />;
  }
  return <Footer data={response.data} settingsData={settingsResponse.data} />;
}

function SocialLinks({ data }: SocialLinksProps) {
  if (!data) {
    return null;
  }

  const { facebook, twitter, instagram, youtube, linkedin, reddit } = data;

  const socialLinks = [
    {
      url: instagram,
      Icon: InstagramBrandIcon,
      label: "Follow us on Instagram",
    },
    {
      url: facebook,
      Icon: FacebookIcon,
      label: "Follow us on Facebook",
    },
    { url: twitter, Icon: XBrandIcon, label: "Follow us on Twitter" },
    {
      url: linkedin,
      Icon: LinkedinBrandIcon,
      label: "Follow us on LinkedIn",
    },
    {
      url: youtube,
      Icon: YoutubeIcon,
      label: "Subscribe to our YouTube channel",
    },
    {
      url: reddit,
      Icon: RedditBrandIcon,
      label: "Join us on Reddit",
    },
  ].filter((link) => link.url);

  return (
    <ul className="flex items-center gap-3">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li key={`social-link-${url}-${index.toString()}`}>
          <Link
            aria-label={label}
            className="focus-ring inline-block transition-opacity hover:opacity-70 focus-visible:outline-accent-green-foreground!"
            href={url ?? "#"}
            prefetch={false}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon className="h-[18px] w-auto fill-accent-green-foreground" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SystemsOperationalPill() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-accent-green-foreground px-3 py-1">
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-accent-green"
      />
      <span className="font-mono text-accent-green text-xs uppercase leading-5 tracking-[0.3px]">
        All systems operational
      </span>
    </div>
  );
}

function FooterTopBar() {
  return (
    <div className="w-full bg-background [background-image:radial-gradient(circle,var(--color-zinc-500)_0.8px,transparent_1.3px)] [background-position:top] [background-repeat:repeat-x] [background-size:6.7px_1.4px]">
      <div className="container flex items-center justify-center py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-[1px] bg-accent-green"
          />
          <p className="whitespace-nowrap font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
            <span>Engine: </span>
            <span className="text-muted-foreground dark:text-accent-green">
              Turbo Start
            </span>
            <span className="bg-linear-to-r from-transparent to-accent-green bg-clip-text text-transparent">
              {" ///"}
            </span>
          </p>
        </div>
        <div className="hidden items-center justify-center md:flex">
          <p className="whitespace-nowrap font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
            [ Nitro: Armed ]
          </p>
        </div>
        <div className="hidden items-center justify-end sm:flex">
          <p className="whitespace-nowrap font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
            [ Ready to Rip ]
          </p>
        </div>
      </div>
    </div>
  );
}

const FOOTER_BAR = "bg-accent-green-foreground/10";

function FooterSocialDotSkeleton() {
  return <div className={cn("size-[18px]", FOOTER_BAR)} />;
}

function FooterLinkColumnSkeleton() {
  return (
    <div>
      <div className={cn("mb-2 h-5 w-20", FOOTER_BAR)} />
      <div className="space-y-1">
        <div className={cn("h-6 w-24", FOOTER_BAR)} />
        <div className={cn("h-6 w-24", FOOTER_BAR)} />
        <div className={cn("h-6 w-24", FOOTER_BAR)} />
      </div>
    </div>
  );
}

export function FooterSkeleton() {
  return (
    <>
      <FooterTopBar />
      <footer className="relative animate-pulse border-t border-accent-green-foreground/10 bg-accent-green text-accent-green-foreground">
        <div className="container flex flex-col items-start gap-10 pt-12 text-start lg:flex-row lg:items-start lg:justify-between">
          <div className="flex w-full max-w-96 shrink flex-col items-start gap-6 lg:items-start">
            <div className="flex w-full flex-col items-start gap-4 lg:items-start">
              <div className={cn("h-7 w-44", FOOTER_BAR)} />
              <div className="flex w-full flex-col">
                <div className={cn("h-5 w-full", FOOTER_BAR)} />
                <div className={cn("h-5 w-3/4", FOOTER_BAR)} />
              </div>
            </div>
            <div className={cn("h-7 w-52 rounded-full", FOOTER_BAR)} />
            <div className="flex items-center gap-3">
              <FooterSocialDotSkeleton />
              <FooterSocialDotSkeleton />
              <FooterSocialDotSkeleton />
              <FooterSocialDotSkeleton />
              <FooterSocialDotSkeleton />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-14 lg:w-auto">
            <FooterLinkColumnSkeleton />
            <FooterLinkColumnSkeleton />
            <FooterLinkColumnSkeleton />
            <FooterLinkColumnSkeleton />
          </div>
        </div>
        <div className="container relative z-10 mt-12 pt-8 pb-6">
          <div className="flex flex-col items-start justify-between gap-6 text-start lg:flex-row lg:items-center lg:gap-4">
            <div className={cn("h-5 w-64", FOOTER_BAR)} />
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className={cn("h-[18px] w-32", FOOTER_BAR)} />
                <div className={cn("h-[18px] w-24", FOOTER_BAR)} />
              </div>
              <div
                className={cn("h-[34px] w-[104px] rounded-full", FOOTER_BAR)}
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function Footer({ data, settingsData }: FooterProps) {
  const { subtitle, columns, copyright, credits } = data;
  const { siteTitle, socialLinks, logos } = settingsData;
  const logo = logos?.logo;
  const footerLogo = logos?.footerLogo;
  const year = new Date().getFullYear();

  return (
    <>
      <FooterTopBar />
      <footer className="relative border-t border-accent-green-foreground/10 bg-accent-green text-accent-green-foreground">
        <div className="container flex flex-col items-start gap-10 pt-12 text-start lg:flex-row lg:items-start lg:justify-between">
          <div className="flex w-full max-w-96 shrink flex-col items-start gap-6 lg:items-start">
            <div className="flex flex-col items-start gap-4 lg:items-start">
              <span className="flex items-center gap-2">
                <Logo
                  alt={siteTitle ?? "Turbo Start Sanity"}
                  className={footerLogo ? "w-44" : "w-44 brightness-0"}
                  image={footerLogo ?? logo}
                  linkClassName="focus-visible:outline-accent-green-foreground!"
                />
              </span>
              {subtitle && (
                <p className="text-accent-green-foreground/70 text-sm leading-5 tracking-[0.24px]">
                  {subtitle}
                </p>
              )}
            </div>
            <SystemsOperationalPill />
            {socialLinks && <SocialLinks data={socialLinks} />}
          </div>
          {Array.isArray(columns) && columns?.length > 0 && (
            <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-14 lg:w-auto">
              {columns.map((column, index) => (
                <div key={`column-${column?._key}-${index}`}>
                  <h3 className="mb-2 font-light font-mono text-accent-green-foreground/60 text-sm uppercase tracking-[0.28px]">
                    {column?.title}
                  </h3>
                  {column?.links && column?.links?.length > 0 && (
                    <ul className="space-y-1 text-accent-green-foreground text-base leading-6">
                      {column?.links?.map((link, columnIndex) => (
                        <li
                          key={`${link?._key}-${columnIndex}-column-${column?._key}`}
                        >
                          <Link
                            className="focus-ring rounded-sm transition-colors hover:text-accent-green-foreground/80 focus-visible:outline-accent-green-foreground!"
                            href={link.href ?? "#"}
                            rel={
                              link.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            target={link.openInNewTab ? "_blank" : undefined}
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="container relative z-10 mt-12 pt-8 pb-6">
          <div className="flex flex-col items-start justify-between gap-6 text-start lg:flex-row lg:items-center lg:gap-4">
            <p className="text-accent-green-foreground/80 text-sm tracking-[0.24px]">
              {copyright ?? `© ${year} ${siteTitle}. All rights reserved.`}
            </p>
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              {credits && credits.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-accent-green-foreground/70 text-sm tracking-[0.24px] lg:flex-nowrap">
                  {credits.map((item, index) => {
                    const logoHeight = normalizedLogoHeight(item.logo, {
                      base: 34,
                      min: 11,
                      max: 18,
                    });
                    const creditContent = (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        {item.label}
                        {item.logo?.id && (
                          <span className="flex shrink-0 items-center">
                            <SanityImage
                              className="w-auto max-w-none rounded-none! object-contain"
                              height={logoHeight}
                              image={item.logo}
                              loading="lazy"
                              style={{ height: logoHeight }}
                              width={75}
                            />
                          </span>
                        )}
                      </span>
                    );

                    return (
                      <Fragment key={item._key}>
                        {index > 0 && (
                          <span
                            aria-hidden="true"
                            className="hidden h-4 w-px shrink-0 bg-accent-green-foreground/30 lg:block"
                          />
                        )}
                        {item.url ? (
                          <a
                            className="focus-ring rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-accent-green-foreground!"
                            href={item.url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {creditContent}
                          </a>
                        ) : (
                          creditContent
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              )}
              <FooterThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
