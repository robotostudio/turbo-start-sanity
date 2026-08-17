"use client";

import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { cn } from "@workspace/tailwind-config/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { GithubStars } from "@/components/github-stars";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import type { ColumnLink, NavigationData } from "@/types";

// Focus-visible mirrors the `hover-surface` wash so keyboard and pointer land
// on the same colour. The `data-nav-on` overrides win over both, keeping the
// translucent treatment where the bar sits on a fixed-ground section.
const NAV_LINK_CLASS =
  "hover-surface h-auto rounded-full bg-transparent px-3 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal outline-none focus-visible:bg-zinc-100 focus-visible:[outline:2px_dotted_currentColor]! focus-visible:outline-offset-2! dark:focus-visible:bg-zinc-900 data-[nav-on=dark]:text-white data-[nav-on=dark]:hover:bg-white/15 data-[nav-on=dark]:focus-visible:bg-white/15 data-[nav-on=light]:text-zinc-900 data-[nav-on=light]:hover:bg-zinc-900/10 data-[nav-on=light]:focus-visible:bg-zinc-900/10";

const TRIGGER_CLASS = cn(
  NAV_LINK_CLASS,
  "data-popup-open:bg-zinc-100 dark:data-popup-open:bg-zinc-900 data-[nav-on=dark]:data-popup-open:bg-white/15 data-[nav-on=light]:data-popup-open:bg-zinc-900/10"
);

// The outline pill draws itself in theme ink, which lands white-on-bright over
// a section whose ground is fixed regardless of theme. Filled variants carry
// their own ground and need nothing.
const NAV_OUTLINE_ADAPTIVE =
  "group-data-[nav-on=dark]:data-[variant=outline]:border-white group-data-[nav-on=dark]:data-[variant=outline]:text-white group-data-[nav-on=light]:data-[variant=outline]:border-zinc-900 group-data-[nav-on=light]:data-[variant=outline]:text-zinc-900";

const NAV_BUTTON_CLASS = cn(
  "h-9 px-4 font-mono font-normal text-sm uppercase tracking-wide",
  NAV_OUTLINE_ADAPTIVE
);

// Anchored in px from the wrapper's bottom (`to top`), so the bar keeps this
// progression at rest however tall the fold strip above is. Only the top
// layer reaches into the strip, fading linearly across it.
const BLUR_LAYERS = [
  {
    radius: 24,
    mask: "linear-gradient(to top, transparent 45px, black 56px, black 83px, transparent calc(83px + var(--hero-fold, 0px)))",
  },
  {
    radius: 8,
    mask: "linear-gradient(to top, transparent 33px, black 45px, black 56px, transparent 66px)",
  },
  {
    radius: 4,
    mask: "linear-gradient(to top, transparent 23px, black 33px, black 45px, transparent 56px)",
  },
  {
    radius: 2,
    mask: "linear-gradient(to top, transparent 13px, black 23px, black 33px, transparent 45px)",
  },
  {
    radius: 1,
    mask: "linear-gradient(to top, transparent 3px, black 13px, black 23px, transparent 33px)",
  },
];

const SATURATE_MASK =
  "linear-gradient(to bottom, black 0%, black 50%, transparent 95%)";

function ProgressiveBlur() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[130%]"
    >
      <div
        className="absolute inset-0 [-webkit-backdrop-filter:saturate(1.5)] [backdrop-filter:saturate(1.5)]"
        style={{ WebkitMaskImage: SATURATE_MASK, maskImage: SATURATE_MASK }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[calc(env(safe-area-inset-top,0px)*2.5)]"
        style={{
          background:
            "linear-gradient(to bottom, transparent env(safe-area-inset-top, 0px), color-mix(in srgb, var(--color-background) 38%, transparent) env(safe-area-inset-top, 0px), transparent 100%)",
        }}
      />
      <div className="-top-[var(--hero-fold,0px)] absolute inset-x-0 bottom-0">
        {BLUR_LAYERS.map(({ radius, mask }) => (
          <div
            className="absolute inset-0"
            key={radius}
            style={{
              WebkitMaskImage: mask,
              maskImage: mask,
              WebkitBackdropFilter: `blur(${radius}px)`,
              backdropFilter: `blur(${radius}px)`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-30% via-background/25 to-transparent dark:from-background/70 dark:via-background/45" />
      <div className="-top-16 absolute inset-x-0 h-16 bg-gradient-to-b from-transparent to-background/30 dark:to-background/70" />
    </div>
  );
}

type MarkedSection = { rect: DOMRect; value: string };

// Contrast of the last marked section covering both the bar and this item's
// centre. Last wins, so a section stacked over another takes precedence.
function contrastUnder(
  itemRect: DOMRect,
  marked: MarkedSection[],
  barBottom: number
) {
  const itemX = itemRect.left + itemRect.width / 2;
  let value = "";
  for (const { rect, value: markedValue } of marked) {
    const covered = Math.min(rect.bottom, barBottom) - Math.max(rect.top, 0);
    if (covered >= barBottom * 0.6 && rect.left < itemX && rect.right > itemX) {
      value = markedValue;
    }
  }
  return value;
}

// Stamps the section's contrast on a link, or clears it when no section covers
// it. Compared first so an unchanged value never touches the DOM.
function applyContrast(el: HTMLElement, value: string) {
  if ((el.dataset.navOn ?? "") === value) {
    return;
  }
  if (value) {
    el.dataset.navOn = value;
  } else {
    delete el.dataset.navOn;
  }
}

// Section-aware contrast: sections that read dark or bright regardless of
// theme carry data-nav-contrast="dark|light". While one covers most of the
// bar, its value is stamped on each link so they can invert instantly.
function useNavContrast(headerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }
    let frame = 0;
    // Cached and refreshed only when the DOM actually changes (route
    // transitions, streamed content) — scrolling never re-queries.
    let markedEls: HTMLElement[] = [];
    let adaptiveEls: HTMLElement[] = [];
    const refresh = () => {
      markedEls = [
        ...document.querySelectorAll<HTMLElement>("[data-nav-contrast]"),
      ];
      adaptiveEls = [
        ...header.querySelectorAll<HTMLElement>("[data-nav-adaptive]"),
      ];
    };
    const measure = (el: HTMLElement): MarkedSection => ({
      rect: el.getBoundingClientRect(),
      value: el.dataset.navContrast ?? "",
    });
    let needsRefresh = false;
    const update = () => {
      frame = 0;
      if (needsRefresh) {
        needsRefresh = false;
        refresh();
      }
      if (markedEls.length === 0 && adaptiveEls.length === 0) {
        return;
      }
      const barBottom = header.getBoundingClientRect().bottom;
      const marked = markedEls.map(measure);
      for (const el of adaptiveEls) {
        const rect = el.getBoundingClientRect();
        applyContrast(el, contrastUnder(rect, marked, barBottom));
      }
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    const observer = new MutationObserver(() => {
      needsRefresh = true;
      schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [headerRef]);
}

export function Navbar({
  navbarData,
  settingsData,
  stars,
}: Readonly<NavigationData & { stars?: number | null }>) {
  const { columns, buttons, gitHubUrl } = navbarData || {};
  const { siteTitle, logos } = settingsData || {};
  const headerRef = useRef<HTMLElement>(null);
  useNavContrast(headerRef);
  // Nothing in the bar marks where you are: the active item is styled no
  // differently from the rest, so `aria-current` is the only signal a screen
  // reader can get. Purely semantic — it paints nothing.
  const pathname = usePathname();
  const currentPage = (href?: string | null) =>
    href && href === pathname ? ("page" as const) : undefined;

  return (
    <header
      className="absolute inset-x-0 top-0 z-40 w-full pt-[env(safe-area-inset-top)] lg:nav-exit lg:sticky lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-screen lg:before:bg-background lg:before:content-['']"
      ref={headerRef}
    >
      <ProgressiveBlur />
      <div className="container relative">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 flex-1 items-center">
            <Logo
              alt={siteTitle ?? "Turbo Start Sanity"}
              className="h-5 w-auto object-left"
              image={logos?.logo}
              imageDark={logos?.logoDark}
            />
          </div>

          <NavigationMenu
            aria-label="Main"
            className="hidden lg:flex"
            closeDelay={150}
            viewport
          >
            <NavigationMenuList className="gap-8">
              {columns?.map((column) => {
                if (column.type === "column") {
                  return (
                    <NavigationMenuItem key={column._key}>
                      <NavigationMenuTrigger
                        className={TRIGGER_CLASS}
                        data-nav-adaptive=""
                      >
                        {column.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="flex w-max max-w-sm flex-col gap-1 p-2">
                          {column.links?.map((link: ColumnLink) => (
                            <li key={link._key}>
                              <NavigationMenuLink
                                aria-current={currentPage(link.href)}
                                className="hover-surface group flex flex-col gap-0.5 rounded-none px-3 py-2.5 focus-ring-inset"
                                closeOnClick
                                render={<Link href={link.href ?? "#"} />}
                              >
                                <span className="font-light font-mono text-foreground text-sm uppercase tracking-normal">
                                  {link.name}
                                </span>
                                {link.description ? (
                                  <span className="line-clamp-2 text-muted-foreground text-sm">
                                    {link.description}
                                  </span>
                                ) : null}
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }
                if (column.type === "link") {
                  if (!column.href) {
                    return null;
                  }
                  return (
                    <NavigationMenuItem key={column._key}>
                      <NavigationMenuLink
                        aria-current={currentPage(column.href)}
                        data-nav-adaptive=""
                        className={cn("flex items-center", NAV_LINK_CLASS)}
                        render={<Link href={column.href} />}
                      >
                        {column.name}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }
                return null;
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div
            className="group hidden flex-1 items-center justify-end gap-2 lg:flex"
            data-nav-adaptive=""
          >
            <GithubStars gitHubUrl={gitHubUrl} stars={stars} />
            <SanityButtons
              buttonClassName={NAV_BUTTON_CLASS}
              buttons={buttons || []}
              className="flex items-center gap-2"
              size="sm"
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
            <GithubStars
              className="-mr-2"
              gitHubUrl={gitHubUrl}
              stars={stars}
            />
            <MobileMenu navbarData={navbarData} settingsData={settingsData} />
          </div>
        </div>
      </div>
    </header>
  );
}
