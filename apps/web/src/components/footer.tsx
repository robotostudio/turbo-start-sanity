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

import { FooterThemeToggle } from "@/components/footer-theme-toggle";
import { Logo } from "@/components/logo";

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

function SocialLinks({ data }: Readonly<SocialLinksProps>) {
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

// Six strokes, drawn in the order the mark would be written: T's bar then its
// stem, then each S's top bar followed by the diagonal it runs into. Every
// stroke is quantised to the dot grid so none is cut mid-dot.
const MARK_FRAMES = [
  "M0 0h498v102h-498z",
  "M294 108h6v6h-6zM288 114h12v6h-12zM282 120h18v6h-18zM276 126h24v6h-24zM270 132h30v6h-30zM264 138h36v6h-36zM258 144h42v6h-42zM252 150h48v6h-48zM246 156h54v6h-54zM240 162h60v6h-60zM234 168h66v6h-66zM228 174h72v6h-72zM222 180h78v6h-78zM216 186h84v6h-84zM210 192h90v6h-90zM204 198h96v6h-96zM198 204h102v312h-102z",
  "M666 0h258v6h-258zM660 6h264v6h-264zM654 12h270v6h-270zM648 18h276v6h-276zM642 24h282v12h-282zM636 36h288v6h-288zM630 42h294v6h-294zM624 48h300v6h-300zM618 54h306v12h-306zM612 66h312v6h-312zM606 72h318v6h-318zM600 78h324v6h-324zM594 84h330v6h-330zM588 90h336v12h-336z",
  "M498 108h18v6h-18zM498 114h30v6h-30zM498 120h42v6h-42zM498 126h60v6h-60zM498 132h72v6h-72zM498 138h84v6h-84zM498 144h96v6h-96zM498 150h114v6h-114zM498 156h126v6h-126zM498 162h138v6h-138zM498 168h156v6h-156zM498 174h168v6h-168zM498 180h180v6h-180zM498 186h198v6h-198zM498 192h210v6h-210zM498 198h222v6h-222zM498 204h240v6h-240zM510 210h240v6h-240zM522 216h240v6h-240zM540 222h240v6h-240zM552 228h240v6h-240zM570 234h234v6h-234zM582 240h240v6h-240zM600 246h234v6h-234zM612 252h234v6h-234zM630 258h234v6h-234zM648 264h228v6h-228zM660 270h228v6h-228zM678 276h222v6h-222zM690 282h228v6h-228zM708 288h222v6h-222zM720 294h222v6h-222zM738 300h222v6h-222zM750 306h222v6h-222zM768 312h216v6h-216zM780 318h222v6h-222zM498 324h84v90h-84zM798 324h210v6h-210zM810 330h198v6h-198zM828 336h180v6h-180zM840 342h168v6h-168zM858 348h150v6h-150zM870 354h138v6h-138zM888 360h120v6h-120zM900 366h108v6h-108zM918 372h90v6h-90zM930 378h78v6h-78zM948 384h60v6h-60zM960 390h48v6h-48zM978 396h30v6h-30zM990 402h18v6h-18zM582 414h336v12h-336zM582 426h330v6h-330zM582 432h324v6h-324zM582 438h318v6h-318zM582 444h312v6h-312zM582 450h306v12h-306zM582 462h300v6h-300zM582 468h294v6h-294zM582 474h288v6h-288zM582 480h282v12h-282zM582 492h276v6h-276zM582 498h270v6h-270zM582 504h264v6h-264zM582 510h258v6h-258z",
  "M1092 0h264v6h-264zM1086 6h270v12h-270zM1080 18h276v6h-276zM1074 24h282v6h-282zM1068 30h288v6h-288zM1062 36h294v12h-294zM1056 48h300v6h-300zM1050 54h306v6h-306zM1044 60h312v6h-312zM1038 66h318v6h-318zM1032 72h324v12h-324zM1026 84h330v6h-330zM1020 90h336v6h-336zM1014 96h342v6h-342z",
  "M924 102h6v6h-6zM1356 102h84v90h-84zM924 108h18v6h-18zM924 114h30v6h-30zM924 120h48v6h-48zM924 126h60v6h-60zM924 132h72v6h-72zM924 138h90v6h-90zM924 144h102v6h-102zM924 150h114v6h-114zM924 156h132v6h-132zM924 162h144v6h-144zM924 168h156v6h-156zM924 174h174v6h-174zM924 180h186v6h-186zM924 186h198v6h-198zM924 192h216v6h-216zM924 198h228v6h-228zM924 204h240v6h-240zM936 210h246v6h-246zM954 216h240v6h-240zM966 222h240v6h-240zM984 228h234v6h-234zM996 234h240v6h-240zM1014 240h234v6h-234zM1032 246h228v6h-228zM1044 252h234v6h-234zM1062 258h228v6h-228zM1074 264h228v6h-228zM1092 270h228v6h-228zM1104 276h228v6h-228zM1122 282h222v6h-222zM1134 288h228v6h-228zM1152 294h222v6h-222zM1164 300h222v6h-222zM1182 306h222v6h-222zM1194 312h222v6h-222zM1212 318h216v6h-216zM1224 324h216v6h-216zM1242 330h198v6h-198zM1254 336h186v6h-186zM1272 342h168v6h-168zM1284 348h156v6h-156zM1302 354h138v6h-138zM1314 360h126v6h-126zM1332 366h108v6h-108zM1344 372h96v6h-96zM1362 378h78v6h-78zM1374 384h66v6h-66zM1392 390h48v6h-48zM1404 396h36v6h-36zM1422 402h18v6h-18zM1434 408h6v6h-6zM1008 414h342v6h-342zM1008 420h336v6h-336zM1008 426h330v6h-330zM1008 432h324v12h-324zM1008 444h318v6h-318zM1008 450h312v6h-312zM1008 456h306v6h-306zM1008 462h300v12h-300zM1008 474h294v6h-294zM1008 480h288v6h-288zM1008 486h282v6h-282zM1008 492h276v6h-276zM1008 498h270v12h-270zM1008 510h264v6h-264z",
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
        {MARK_FRAMES.map((frame, index) => (
          <path
            className="mark-frame"
            d={frame}
            fill="url(#footer-mark-dots)"
            key={frame.slice(0, 16)}
            style={{ "--frame-index": index } as CSSProperties}
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

function Footer({ data, settingsData }: Readonly<FooterProps>) {
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
                            className="link-underline after:-bottom-0.5! rounded-sm focus-ring after:transition-none! outline-accent-green-foreground!"
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
