"use client";

import { env } from "@workspace/env/client";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { SanityIcon } from "@workspace/sanity-blocks/internal/sanity-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu";
import Link from "next/link";
import useSWR from "swr";

import type { ColumnLink, NavigationData } from "@/types";
import { GithubStars } from "./github-stars";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const fetcher = async (url: string): Promise<NavigationData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch navigation data");
  }
  return response.json();
};

const TRIGGER_CLASS =
  "h-auto bg-transparent px-2 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal transition-opacity hover:bg-transparent hover:opacity-70 focus:bg-transparent focus:text-foreground data-popup-open:bg-transparent data-popup-open:text-foreground";

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
            <div className="h-7 w-44 bg-muted/50" />
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <NavItemSkeleton />
            <NavItemSkeleton />
            <NavItemSkeleton />
          </div>

          <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
            <div className="h-7 w-20 bg-muted/50" />
            <div className="h-9 w-28 rounded-full bg-muted/50" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
            <div className="h-7 w-20 bg-muted/50" />
            <div className="size-10 rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function Navbar({
  navbarData: initialNavbarData,
  settingsData: initialSettingsData,
  stars,
}: Readonly<NavigationData & { stars?: number | null }>) {
  const { data, error, isLoading } = useSWR<NavigationData>(
    "/api/navigation",
    fetcher,
    {
      fallbackData: {
        navbarData: initialNavbarData,
        settingsData: initialSettingsData,
      },
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: true,
      refreshInterval: 30_000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const navigationData = data || {
    navbarData: initialNavbarData,
    settingsData: initialSettingsData,
  };
  const { navbarData, settingsData } = navigationData;
  const { columns, buttons, gitHubUrl } = navbarData || {};
  const { siteTitle, logos } = settingsData || {};

  // Show skeleton only on initial mount when no fallback data is available
  if (isLoading && !data && !(initialNavbarData && initialSettingsData)) {
    return <NavbarSkeleton />;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/20 backdrop-blur-sm dark:bg-background/40">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 flex-1 items-center">
            <Logo
              alt={siteTitle ?? "Turbo Start Sanity"}
              className="w-44"
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
                        <ul className="grid w-72 gap-1 bg-background p-2">
                          {column.links?.map((link: ColumnLink) => (
                            <li key={link._key}>
                              <NavigationMenuLink
                                className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                                closeOnClick
                                render={<Link href={link.href ?? "#"} />}
                              >
                                {link.icon ? (
                                  <SanityIcon
                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                    icon={link.icon}
                                  />
                                ) : null}
                                <div className="grid gap-0.5">
                                  <div className="font-light font-mono text-foreground text-sm uppercase tracking-wide">
                                    {link.name}
                                  </div>
                                  {link.description ? (
                                    <div className="line-clamp-2 text-muted-foreground text-sm">
                                      {link.description}
                                    </div>
                                  ) : null}
                                </div>
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
                        className="flex h-auto items-center rounded-md px-2 py-2 font-light font-mono text-foreground text-sm uppercase tracking-normal transition-opacity hover:opacity-70"
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

      {error && env.NODE_ENV === "development" && (
        <div className="border-destructive/20 border-b bg-destructive/10 px-4 py-2 text-destructive text-xs">
          Navigation data fetch error: {error.message}
        </div>
      )}
    </header>
  );
}
