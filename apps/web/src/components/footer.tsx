import Link from "next/link";

import { sanityFetch } from "@/lib/sanity/live";
import { queryFooterData, queryGlobalSeoSettings } from "@/lib/sanity/query";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@/lib/sanity/sanity.types";

import { Logo } from "./logo";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
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

export async function FooterServer() {
  const [response, settingsResponse] = await Promise.all([
    sanityFetch({
      query: queryFooterData,
    }),
    sanityFetch({
      query: queryGlobalSeoSettings,
    }),
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

  const { facebook, twitter, instagram, youtube, linkedin } = data;

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
      <section className="container mx-auto px-4 md:px-6">
        <div className="h-[500px] lg:h-auto">
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <div className="h-[40px] w-[80px] animate-pulse rounded bg-muted" />
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
  const { subtitle, columns } = data;
  const { siteTitle, logo, socialLinks } = settingsData;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 pb-8">
      <section className="container mx-auto">
        <div className="h-[500px] lg:h-auto">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-4 text-center md:px-6 lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 md:gap-8 lg:items-start">
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
              <div className="grid grid-cols-3 gap-6 lg:mr-20 lg:gap-28">
                {columns.map((column, index) => (
                  <div key={`column-${column?._key}-${index}`}>
                    <h3 className="mb-6 font-semibold">{column?.title}</h3>
                    {column?.links && column?.links?.length > 0 && (
                      <ul className="space-y-4 text-muted-foreground text-sm dark:text-zinc-400">
                        {column?.links?.map((link,columnIndex) => (
                          <li
                            className="font-medium hover:text-primary"
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
          <div className="mt-20 border-t pt-8">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-center font-normal text-muted-foreground text-sm md:px-6 lg:flex-row lg:items-center lg:text-left">
              <p>
                © {year} {siteTitle}. All rights reserved.
              </p>
              <ul className="flex justify-center gap-4 lg:justify-start">
                <li className="hover:text-primary">
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
                <li className="hover:text-primary">
                  <Link href="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
