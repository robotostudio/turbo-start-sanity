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
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import Link from "next/link";
import { Fragment } from "react";

import { FooterThemeToggle } from "./footer-theme-toggle";
import { Logo } from "./logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  RedditIcon,
  XIcon,
  YoutubeIcon,
} from "./social-icons";

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
      Icon: InstagramIcon,
      label: "Follow us on Instagram",
    },
    {
      url: facebook,
      Icon: FacebookIcon,
      label: "Follow us on Facebook",
    },
    { url: twitter, Icon: XIcon, label: "Follow us on Twitter" },
    {
      url: linkedin,
      Icon: LinkedinIcon,
      label: "Follow us on LinkedIn",
    },
    {
      url: youtube,
      Icon: YoutubeIcon,
      label: "Subscribe to our YouTube channel",
    },
    {
      url: reddit,
      Icon: RedditIcon,
      label: "Join us on Reddit",
    },
  ].filter((link) => link.url);

  return (
    <ul className="flex items-center gap-3">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li key={`social-link-${url}-${index.toString()}`}>
          <Link
            aria-label={label}
            className="focus-ring inline-block focus-visible:outline-accent-green-foreground!"
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

// Alternating vertical offsets give the indicator squares a subtle zig-zag.
const FOOTER_TOP_BAR_SQUARES = [
  { key: "a", offset: "-translate-y-px" },
  { key: "b", offset: "translate-y-px" },
  { key: "c", offset: "-translate-y-px" },
  { key: "d", offset: "translate-y-px" },
];

function FooterTopBar() {
  return (
    <div className="w-full border-border border-t border-dotted bg-background">
      <div className="container flex items-center justify-between gap-4 py-4">
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
            <span className="text-muted-foreground/50">{" ///"}</span>
          </p>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <span
            aria-hidden="true"
            className="h-4 w-[58px] shrink-0 bg-grid-dots-stipple text-foreground [clip-path:polygon(50%_0%,100%_100%,0%_100%)]"
          />
          <p className="whitespace-nowrap font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
            [ Nitro: Armed ]
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span
            aria-hidden="true"
            className="hidden items-center gap-2 sm:flex"
          >
            {FOOTER_TOP_BAR_SQUARES.map((square) => (
              <span
                className={`size-[18px] shrink-0 rounded-[1px] bg-grid-dots-stipple text-foreground ${square.offset}`}
                key={square.key}
              />
            ))}
          </span>
          <p className="whitespace-nowrap font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
            [ Ready to Rip ]
          </p>
        </div>
      </div>
    </div>
  );
}

export function FooterSkeleton() {
  return (
    <>
      <FooterTopBar />
      <footer className="border-t border-accent-green-foreground/10 bg-accent-green text-accent-green-foreground">
        <div className="container flex flex-col gap-10 pt-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex w-full max-w-96 shrink flex-col items-center gap-6 lg:items-start">
            <div className="w-full">
              <span className="flex items-center justify-center gap-3 lg:justify-start">
                <div className="h-8 w-40 animate-pulse rounded bg-accent-green-foreground/10" />
              </span>
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-accent-green-foreground/10" />
            </div>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  className="h-[18px] w-[18px] animate-pulse rounded bg-accent-green-foreground/10"
                  key={i}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-14">
            {[1, 2, 3, 4].map((col) => (
              <div key={col}>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-accent-green-foreground/10" />
                <div className="space-y-1.5">
                  {[1, 2, 3].map((item) => (
                    <div
                      className="h-4 w-full animate-pulse rounded bg-accent-green-foreground/10"
                      key={item}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="container mt-12 flex flex-col justify-between gap-4 pt-8 pb-6 text-center lg:flex-row lg:items-center lg:text-left">
          <div className="h-4 w-48 animate-pulse rounded bg-accent-green-foreground/10" />
          <div className="flex justify-center gap-4 lg:justify-start">
            <div className="h-4 w-32 animate-pulse rounded bg-accent-green-foreground/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-accent-green-foreground/10" />
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
      <footer className="border-t border-accent-green-foreground/10 bg-accent-green text-accent-green-foreground">
        <div className="container flex flex-col items-start gap-10 pt-12 text-left lg:flex-row lg:items-start lg:justify-between lg:text-left">
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
                            className="focus-ring rounded-sm focus-visible:outline-accent-green-foreground!"
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
          <div className="flex flex-col items-start justify-between gap-6 text-left lg:flex-row lg:items-center lg:gap-4">
            <p className="text-accent-green-foreground/80 text-sm tracking-[0.24px]">
              {copyright ?? `© ${year} ${siteTitle}. All rights reserved.`}
            </p>
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              {credits && credits.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-accent-green-foreground/70 text-sm tracking-[0.24px] lg:flex-nowrap">
                  {credits.map((item, index) => {
                    const creditContent = (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {item.label}
                        {item.logo?.id && (
                          <span className="flex shrink-0 items-center">
                            <SanityImage
                              className="h-4 w-auto max-w-none rounded-none! object-contain"
                              height={16}
                              image={item.logo}
                              loading="lazy"
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
                            className="focus-ring focus-visible:outline-accent-green-foreground!"
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
