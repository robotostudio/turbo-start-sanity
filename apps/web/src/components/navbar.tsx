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
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { ModeToggle } from "./mode-toggle";

const fetcher = async (url: string): Promise<NavigationData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch navigation data");
  }
  return response.json();
};

const TRIGGER_CLASS =
  "h-auto bg-transparent px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-muted-foreground data-popup-open:bg-transparent data-popup-open:text-foreground";

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 w-40 items-center">
            <div className="h-10 w-40 animate-pulse rounded bg-muted/50" />
          </div>

          <div className="h-10 w-10 animate-pulse rounded bg-muted/50 lg:hidden" />
        </div>
      </div>
    </header>
  );
}

export function Navbar({
  navbarData: initialNavbarData,
  settingsData: initialSettingsData,
}: Readonly<NavigationData>) {
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
  const { columns, buttons } = navbarData || {};
  const { logo, siteTitle } = settingsData || {};

  // Show skeleton only on initial mount when no fallback data is available
  if (isLoading && !data && !(initialNavbarData && initialSettingsData)) {
    return <NavbarSkeleton />;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 w-40 items-center">
            {logo && (
              <Logo
                alt={siteTitle || ""}
                height={40}
                image={logo}
                priority
                width={120}
              />
            )}
          </div>

          <NavigationMenu aria-label="Main" className="hidden lg:flex" viewport>
            <NavigationMenuList className="gap-1">
              {columns?.map((column) => {
                if (column.type === "column") {
                  return (
                    <NavigationMenuItem key={column._key}>
                      <NavigationMenuTrigger className={TRIGGER_CLASS}>
                        {column.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[320px] gap-1 p-2">
                          {column.links?.map((link: ColumnLink) => (
                            <li key={link._key}>
                              <NavigationMenuLink
                                className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                                closeOnClick
                                render={<Link href={link.href ?? "#"} />}
                              >
                                {link.icon ? (
                                  <SanityIcon
                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                    icon={link.icon}
                                  />
                                ) : null}
                                <div className="grid gap-1">
                                  <div className="font-medium leading-none group-hover:text-accent-foreground">
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
                        className="flex h-full items-center rounded-md px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
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

          <div className="hidden items-center gap-4 lg:flex">
            <ModeToggle />
            <SanityButtons
              buttonClassName="rounded-lg"
              buttons={buttons || []}
              className="flex items-center gap-2"
            />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ModeToggle />
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
