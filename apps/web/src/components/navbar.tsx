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

import type { ColumnLink, NavigationData } from "@/types";
import { GithubStars } from "./github-stars";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const TRIGGER_CLASS =
  "h-auto rounded-full bg-transparent px-3 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal outline-none hover:bg-zinc-100 focus:text-foreground focus-visible:bg-zinc-100 focus-visible:outline-none! data-popup-open:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:data-popup-open:bg-zinc-800";

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
            <div className="size-10 rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
    </header>
  );
}

// Progressive (gradient) blur: blur ramps up toward the top edge where page
// content scrolls under the bar. Layered masked backdrop-blur bands approximate
// a variable-radius blur; the theme scrim keeps the nav readable on any
// background and stops content/footer bleeding through.
function ProgressiveBlur() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 backdrop-blur-[5px]" />
      <div className="absolute inset-0 backdrop-blur-[10px] [mask-image:linear-gradient(to_top,transparent_25%,black_65%)]" />
      <div className="absolute inset-0 backdrop-blur-[20px] [mask-image:linear-gradient(to_top,transparent_55%,black_90%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/75 to-background/55" />
    </div>
  );
}

export function Navbar({
  navbarData,
  settingsData,
  stars,
}: Readonly<NavigationData & { stars?: number | null }>) {
  const { columns, buttons, gitHubUrl } = navbarData || {};
  const { siteTitle, logos } = settingsData || {};

  // The header's `before` pseudo extends a solid slab above the bar (at the
  // navbar's z-index, over the z-0 footer) so the fixed sticky-reveal footer
  // can't peek through during the top overscroll bounce.
  return (
    <header className="sticky top-0 z-40 w-full before:absolute before:inset-x-0 before:bottom-full before:h-screen before:bg-background before:content-['']">
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
                      <NavigationMenuTrigger className={TRIGGER_CLASS}>
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
                        className="flex h-auto items-center rounded-full px-3 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal outline-none hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none! dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
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
