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
import {
  FacebookIcon,
  InstagramBrandIcon,
  LinkedinBrandIcon,
  RedditBrandIcon,
  XBrandIcon,
  YoutubeIcon,
} from "@workspace/sanity-blocks/internal/icons";
import { normalizedLogoHeight } from "@workspace/sanity-blocks/internal/logo-height";
import { SanityImage } from "@workspace/sanity-blocks/internal/sanity-image";
import { cn } from "@workspace/tailwind-config/utils";
import Link from "next/link";
import { type CSSProperties, Fragment } from "react";

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
    <ul className="-mx-1.5 flex items-center">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li key={`social-link-${url}-${index.toString()}`}>
          <Link
            aria-label={label}
            className="focus-ring-inset group inline-flex cursor-pointer items-center justify-center p-1.5 hover:bg-accent-green-foreground focus-visible:outline-accent-green-foreground!"
            href={url ?? "#"}
            prefetch={false}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon className="h-[18px] w-auto fill-accent-green-foreground group-hover:fill-accent-green" />
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

const MARK_COLUMNS = [
  "M0 0h120v102h-120z",
  "M120 0h120v102h-120zM234 168h6v6h-6zM228 174h12v6h-12zM222 180h18v6h-18zM216 186h24v6h-24zM210 192h30v6h-30zM204 198h36v6h-36zM198 204h42v312h-42z",
  "M240 0h120v102h-120zM294 108h6v6h-6zM288 114h12v6h-12zM282 120h18v6h-18zM276 126h24v6h-24zM270 132h30v6h-30zM264 138h36v6h-36zM258 144h42v6h-42zM252 150h48v6h-48zM246 156h54v6h-54zM240 162h60v354h-60z",
  "M360 0h120v102h-120z",
  "M480 0h18v102h-18zM594 84h6v6h-6zM588 90h12v12h-12zM498 108h18v6h-18zM498 114h30v6h-30zM498 120h42v6h-42zM498 126h60v6h-60zM498 132h72v6h-72zM498 138h84v6h-84zM498 144h96v6h-96zM498 150h102v60h-102zM510 210h90v6h-90zM522 216h78v6h-78zM540 222h60v6h-60zM552 228h48v6h-48zM570 234h30v6h-30zM582 240h18v6h-18zM498 324h84v90h-84zM582 414h18v102h-18z",
  "M666 0h54v6h-54zM660 6h60v6h-60zM654 12h66v6h-66zM648 18h72v6h-72zM642 24h78v12h-78zM636 36h84v6h-84zM630 42h90v6h-90zM624 48h96v6h-96zM618 54h102v12h-102zM612 66h108v6h-108zM606 72h114v6h-114zM600 78h120v24h-120zM600 150h12v6h-12zM600 156h24v6h-24zM600 162h36v6h-36zM600 168h54v6h-54zM600 174h66v6h-66zM600 180h78v6h-78zM600 186h96v6h-96zM600 192h108v6h-108zM600 198h120v54h-120zM612 252h108v6h-108zM630 258h90v6h-90zM648 264h72v6h-72zM660 270h60v6h-60zM678 276h42v6h-42zM690 282h30v6h-30zM708 288h12v6h-12zM600 414h120v102h-120z",
  "M720 0h120v102h-120zM720 204h18v6h-18zM720 210h30v6h-30zM720 216h42v6h-42zM720 222h60v6h-60zM720 228h72v6h-72zM720 234h84v6h-84zM720 240h102v6h-102zM720 246h114v6h-114zM720 252h120v48h-120zM738 300h102v6h-102zM750 306h90v6h-90zM768 312h72v6h-72zM780 318h60v6h-60zM798 324h42v6h-42zM810 330h30v6h-30zM828 336h12v6h-12zM720 414h120v102h-120z",
  "M840 0h84v102h-84zM924 102h6v6h-6zM924 108h18v6h-18zM924 114h30v6h-30zM924 120h36v90h-36zM936 210h24v6h-24zM954 216h6v6h-6zM840 252h6v6h-6zM840 258h24v6h-24zM840 264h36v6h-36zM840 270h48v6h-48zM840 276h60v6h-60zM840 282h78v6h-78zM840 288h90v6h-90zM840 294h102v6h-102zM840 300h120v48h-120zM858 348h102v6h-102zM870 354h90v6h-90zM888 360h72v6h-72zM900 366h60v6h-60zM918 372h42v6h-42zM930 378h30v6h-30zM948 384h12v6h-12zM840 414h78v12h-78zM840 426h72v6h-72zM840 432h66v6h-66zM840 438h60v6h-60zM840 444h54v6h-54zM840 450h48v12h-48zM840 462h42v6h-42zM840 468h36v6h-36zM840 474h30v6h-30zM840 480h24v12h-24zM840 492h18v6h-18zM840 498h12v6h-12zM840 504h6v6h-6z",
  "M1074 24h6v6h-6zM1068 30h12v6h-12zM1062 36h18v12h-18zM1056 48h24v6h-24zM1050 54h30v6h-30zM1044 60h36v6h-36zM1038 66h42v6h-42zM1032 72h48v12h-48zM1026 84h54v6h-54zM1020 90h60v6h-60zM1014 96h66v6h-66zM960 120h12v6h-12zM960 126h24v6h-24zM960 132h36v6h-36zM960 138h54v6h-54zM960 144h66v6h-66zM960 150h78v6h-78zM960 156h96v6h-96zM960 162h108v6h-108zM960 168h120v54h-120zM966 222h114v6h-114zM984 228h96v6h-96zM996 234h84v6h-84zM1014 240h66v6h-66zM1032 246h48v6h-48zM1044 252h36v6h-36zM1062 258h18v6h-18zM1074 264h6v6h-6zM960 306h12v6h-12zM960 312h24v6h-24zM960 318h42v6h-42zM960 324h48v72h-48zM978 396h30v6h-30zM990 402h18v6h-18zM1008 414h72v102h-72z",
  "M1092 0h108v6h-108zM1086 6h114v12h-114zM1080 18h120v84h-120zM1080 174h18v6h-18zM1080 180h30v6h-30zM1080 186h42v6h-42zM1080 192h60v6h-60zM1080 198h72v6h-72zM1080 204h84v6h-84zM1080 210h102v6h-102zM1080 216h114v6h-114zM1080 222h120v48h-120zM1092 270h108v6h-108zM1104 276h96v6h-96zM1122 282h78v6h-78zM1134 288h66v6h-66zM1152 294h48v6h-48zM1164 300h36v6h-36zM1182 306h18v6h-18zM1194 312h6v6h-6zM1080 414h120v102h-120z",
  "M1200 0h120v102h-120zM1200 222h6v6h-6zM1200 228h18v6h-18zM1200 234h36v6h-36zM1200 240h48v6h-48zM1200 246h60v6h-60zM1200 252h78v6h-78zM1200 258h90v6h-90zM1200 264h102v6h-102zM1200 270h120v48h-120zM1212 318h108v6h-108zM1224 324h96v6h-96zM1242 330h78v6h-78zM1254 336h66v6h-66zM1272 342h48v6h-48zM1284 348h36v6h-36zM1302 354h18v6h-18zM1314 360h6v6h-6zM1200 414h120v42h-120zM1200 456h114v6h-114zM1200 462h108v12h-108zM1200 474h102v6h-102zM1200 480h96v6h-96zM1200 486h90v6h-90zM1200 492h84v6h-84zM1200 498h78v12h-78zM1200 510h72v6h-72z",
  "M1320 0h36v102h-36zM1356 102h84v90h-84zM1320 276h12v6h-12zM1320 282h24v6h-24zM1320 288h42v6h-42zM1320 294h54v6h-54zM1320 300h66v6h-66zM1320 306h84v6h-84zM1320 312h96v6h-96zM1320 318h108v6h-108zM1320 324h120v42h-120zM1332 366h108v6h-108zM1344 372h96v6h-96zM1362 378h78v6h-78zM1374 384h66v6h-66zM1392 390h48v6h-48zM1404 396h36v6h-36zM1422 402h18v6h-18zM1434 408h6v6h-6zM1320 414h30v6h-30zM1320 420h24v6h-24zM1320 426h18v6h-18zM1320 432h12v12h-12zM1320 444h6v6h-6z",
];

/** Decorative slash motif closing the footer.
 *
 * The geometry is the design's artwork quantised to the 6px dot grid: every
 * kept cell is a whole pitch wide, so shape edges land on cell boundaries and
 * the pattern's dot — centred in each cell — is never sliced by an edge. That's
 * why the diagonals read as steps rather than clean lines. The band's shorter
 * aspect crops the lower half of the motif off. */
function FooterMark() {
  return (
    <div
      aria-hidden="true"
      className="aspect-[1440/320] w-full overflow-hidden text-accent-green-foreground"
    >
      <svg
        aria-hidden="true"
        className="w-full motion-reduce:[&_path]:animate-none"
        viewBox="0 0 1440 516"
      >
        <defs>
          <pattern
            height="6"
            id="footer-mark-dots"
            patternUnits="userSpaceOnUse"
            width="6"
          >
            <circle cx="3" cy="3" fill="currentColor" r="0.7" />
          </pattern>
        </defs>
        {MARK_COLUMNS.map((slice, index) => (
          <path
            className="mark-shutter"
            d={slice}
            fill="url(#footer-mark-dots)"
            key={slice.slice(0, 16)}
            style={{ "--shutter-index": index } as CSSProperties}
          />
        ))}
      </svg>
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
        <div className="container relative z-10 mt-12 pt-8 pb-8">
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
        <FooterMark />
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
                  className={
                    footerLogo
                      ? "h-5 w-auto object-left"
                      : "h-5 w-auto object-left brightness-0"
                  }
                  image={footerLogo ?? logo}
                  linkClassName="focus-ring focus-visible:outline-accent-green-foreground!"
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
                    <ul className="space-y-1 text-accent-green-foreground text-sm leading-6">
                      {column?.links?.map((link, columnIndex) => (
                        <li
                          key={`${link?._key}-${columnIndex}-column-${column?._key}`}
                        >
                          <Link
                            className="link-underline after:-bottom-0.5! rounded-sm outline-none after:transition-none!"
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
        <div className="container relative z-10 my-12 pt-8 pb-8">
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
                            className="focus-ring rounded-none hover:opacity-90 focus-visible:outline-accent-green-foreground!"
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
        <FooterMark />
      </footer>
    </>
  );
}
