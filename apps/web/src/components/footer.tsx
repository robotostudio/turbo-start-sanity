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
    <ul className="flex items-center space-x-6 text-muted-foreground">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li
          className="font-medium hover:text-primary"
          key={`social-link-${url}-${index.toString()}`}
        >
          <Link
            aria-label={label}
            className="focus-ring inline-block"
            href={url ?? "#"}
            prefetch={false}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon className="fill-muted-foreground hover:fill-primary/80 dark:fill-zinc-400 dark:hover:fill-primary" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="mt-16 pb-8">
      <section className="container">
        <div className="h-125 lg:h-auto">
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <div className="h-10 w-20 animate-pulse rounded bg-muted" />
                </span>
                <div className="mt-6 h-16 w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="flex items-center space-x-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    className="h-6 w-6 animate-pulse rounded bg-muted"
                    key={i}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {[1, 2, 3].map((col) => (
                <div key={col}>
                  <div className="mb-6 h-6 w-24 animate-pulse rounded bg-muted" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        className="h-4 w-full animate-pulse rounded bg-muted"
                        key={item}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="flex justify-center gap-4 lg:justify-start">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}

function Footer({ data, settingsData }: FooterProps) {
  const {
    subtitle,
    columns,
    credit,
    creditUrl,
    copyright,
    watermark,
    credits,
  } = data;
  const { siteTitle, logo, socialLinks } = settingsData;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 pb-8">
      <section>
        <div className="h-125 lg:h-auto">
          <div className="container flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:items-start lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center gap-6 md:gap-8 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <Logo alt={siteTitle} image={logo} priority />
                </span>
                {subtitle && (
                  <p className="mt-6 text-muted-foreground text-sm dark:text-zinc-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {socialLinks && <SocialLinks data={socialLinks} />}
            </div>
            {Array.isArray(columns) && columns?.length > 0 && (
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-16">
                {columns.map((column, index) => (
                  <div key={`column-${column?._key}-${index}`}>
                    <h3 className="mb-4 font-normal text-base text-zinc-400 leading-6 tracking-[0.24px]">
                      {column?.title}
                    </h3>
                    {column?.links && column?.links?.length > 0 && (
                      <ul className="space-y-3 text-base text-zinc-600 leading-6 tracking-[0.24px] dark:text-zinc-100">
                        {column?.links?.map((link, columnIndex) => (
                          <li
                            className="font-normal transition-colors hover:text-foreground"
                            key={`${link?._key}-${columnIndex}-column-${column?._key}`}
                          >
                            <Link
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
          <div className="container relative z-10 mt-40 pt-8">
            <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:gap-4 lg:text-left">
              <p className="order-2 text-sm text-zinc-600 tracking-[0.24px] lg:order-none dark:text-zinc-100">
                {copyright ?? `© ${year} ${siteTitle}. All rights reserved.`}
              </p>
              {credit && (
                <div className="relative order-1 lg:order-none">
                  {creditUrl ? (
                    <a
                      className="font-mono text-foreground text-sm uppercase tracking-[1.68px]"
                      href={creditUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {credit}
                    </a>
                  ) : (
                    <span className="font-mono text-foreground text-sm uppercase tracking-[1.68px]">
                      {credit}
                    </span>
                  )}
                  {watermark?.id && (
                    <SanityImage
                      className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute -top-15 left-1/2 min-w-66 max-w-none select-none object-fill opacity-50 lg:left-[58%]"
                      height={240}
                      htmlHeight={240}
                      htmlWidth={264}
                      image={watermark}
                      loading="lazy"
                      width={264}
                    />
                  )}
                </div>
              )}
              {credits && credits.length > 0 && (
                <div className="order-3 flex items-center gap-4 text-sm text-zinc-600 lg:order-none dark:text-zinc-100">
                  {credits.map((item, index) => (
                    <Fragment key={item._key}>
                      {index > 0 && (
                        <span
                          aria-hidden="true"
                          className="h-4 w-px bg-zinc-400"
                        />
                      )}
                      <span className="flex items-center gap-1.5">
                        {item.label}
                        {item.logo?.id && (
                          <span className="flex shrink-0 items-center">
                            <SanityImage
                              className="h-auto w-28 rounded-none! object-contain invert dark:invert-0"
                              height={16}
                              image={item.logo}
                              loading="lazy"
                              width={75}
                            />
                          </span>
                        )}
                      </span>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
