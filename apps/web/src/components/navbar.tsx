"use client";

import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import Link from "next/link";
import { useEffect, useRef } from "react";

import type { ColumnLink, NavigationData } from "@/types";
import { GithubStars } from "./github-stars";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const TRIGGER_CLASS =
  "h-auto rounded-full bg-transparent px-3 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal outline-none data-[nav-on=dark]:not-hover:text-white data-[nav-on=light]:not-hover:text-zinc-900 hover:bg-zinc-100 focus:text-foreground focus-visible:bg-zinc-200 focus-visible:outline-none! data-popup-open:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:data-popup-open:bg-zinc-800";

const NAV_BUTTON_CLASS =
  "h-9 px-4 font-mono font-normal text-sm uppercase tracking-wide";

function NavItemSkeleton() {
  return <div className="h-5 w-20 bg-muted/50" />;
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full animate-pulse bg-background/60 backdrop-blur-lg dark:bg-background/60">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 flex-1 items-center">
            <div className="h-5 w-14 bg-muted/50" />
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <NavItemSkeleton />
            <NavItemSkeleton />
            <NavItemSkeleton />
            <NavItemSkeleton />
          </div>

          <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
            <div className="h-9 w-28 rounded-full bg-muted/50" />
            <div className="h-9 w-28 rounded-full bg-muted/50" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
            <div className="size-8 bg-muted/50" />
          </div>
        </div>
      </div>
    </header>
  );
}

const BLUR_LAYERS = [
  {
    radius: 32,
    mask: "linear-gradient(to bottom, black 0%, black 20%, transparent 32%)",
  },
  {
    radius: 16,
    mask: "linear-gradient(to bottom, transparent 8%, black 20%, black 32%, transparent 46%)",
  },
  {
    radius: 8,
    mask: "linear-gradient(to bottom, transparent 20%, black 32%, black 46%, transparent 60%)",
  },
  {
    radius: 4,
    mask: "linear-gradient(to bottom, transparent 32%, black 46%, black 60%, transparent 72%)",
  },
  {
    radius: 2,
    mask: "linear-gradient(to bottom, transparent 46%, black 60%, black 72%, transparent 84%)",
  },
  {
    radius: 1,
    mask: "linear-gradient(to bottom, transparent 60%, black 72%, black 84%, transparent 96%)",
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
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-30% via-background/25 to-transparent dark:from-background/30 dark:via-background/15" />
    </div>
  );
}

// Section-aware contrast: sections that read dark or bright regardless of
// theme carry data-nav-contrast="dark|light". While one covers most of the
// bar, its value is stamped on the header so the links can invert instantly.
function useNavContrast(headerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }
    let frame = 0;
    // Cached and refreshed only when the DOM actually changes (route
    // transitions, streamed content) — scrolling never re-queries.
    let markedEls: Element[] = [];
    let adaptiveEls: Element[] = [];
    const refresh = () => {
      markedEls = [...document.querySelectorAll("[data-nav-contrast]")];
      adaptiveEls = [...header.querySelectorAll("[data-nav-adaptive]")];
    };
    const update = () => {
      frame = 0;
      if (markedEls.length === 0 && adaptiveEls.length === 0) {
        return;
      }
      const barBottom = header.getBoundingClientRect().bottom;
      const marked = markedEls.map((el) => ({
        rect: el.getBoundingClientRect(),
        value: el.getAttribute("data-nav-contrast") ?? "",
      }));
      for (const item of adaptiveEls) {
        const itemRect = item.getBoundingClientRect();
        const itemX = itemRect.left + itemRect.width / 2;
        let value = "";
        for (const { rect, value: markedValue } of marked) {
          const covered =
            Math.min(rect.bottom, barBottom) - Math.max(rect.top, 0);
          if (
            covered >= barBottom * 0.6 &&
            rect.left < itemX &&
            rect.right > itemX
          ) {
            value = markedValue;
          }
        }
        if ((item.getAttribute("data-nav-on") ?? "") !== value) {
          if (value) {
            item.setAttribute("data-nav-on", value);
          } else {
            item.removeAttribute("data-nav-on");
          }
        }
      }
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    // Route changes swap page content without remounting the navbar and
    // without a scroll event — the observer keeps colors fresh there too.
    const observer = new MutationObserver(() => {
      refresh();
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

  return (
    <header
      className="sticky top-0 z-40 w-full before:absolute before:inset-x-0 before:bottom-full before:h-screen before:bg-background before:content-['']"
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
                                className="group flex flex-col gap-0.5 rounded-none px-3 py-2.5 transition-colors focus-ring-inset hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                        data-nav-adaptive=""
                        className="flex h-auto items-center rounded-full px-3 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal outline-none data-[nav-on=dark]:not-hover:text-white data-[nav-on=light]:not-hover:text-zinc-900 hover:bg-zinc-100 focus-visible:bg-zinc-200 focus-visible:outline-none! dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
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

          <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
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
