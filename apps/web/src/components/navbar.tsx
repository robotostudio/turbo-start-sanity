"use client";

import { env } from "@workspace/env/client";
import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import type { ColumnLink, NavColumn, NavigationData } from "@/types";
import { MenuLink } from "./elements/menu-link";
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

function DesktopColumnDropdown({
  column,
}: {
  column: Extract<NavColumn, { type: "column" }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div className="group relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1 px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        type="button"
      >
        {column.title}
        <ChevronDown className="size-3 transition-transform group-hover:rotate-180" />
      </button>
      {isOpen ? (
        <div
          className="fade-in-0 zoom-in-95 absolute top-full left-0 z-50 min-w-70 animate-in rounded-lg border bg-popover p-2 shadow-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menu"
          tabIndex={-1}
        >
          <div className="grid gap-1">
            {column.links?.map((link: ColumnLink) => (
              <MenuLink
                description={link.description || ""}
                href={link.href || ""}
                icon={link.icon}
                key={link._key}
                name={link.name || ""}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DesktopColumnLink({
  column,
}: {
  column: Extract<NavColumn, { type: "link" }>;
}) {
  if (!column.href) return null;

  return (
    <Link
      className="px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
      href={column.href}
    >
      {column.name}
    </Link>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/70 backdrop-blur-md">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex h-10 w-40 items-center">
            <div className="h-10 w-40 animate-pulse rounded bg-muted/50" />
          </div>

          <div className="h-10 w-10 animate-pulse rounded bg-muted/50 md:hidden" />
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

  if (isLoading && !data && !(initialNavbarData && initialSettingsData)) {
    return <NavbarSkeleton />;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/70 backdrop-blur-md">
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

          <nav className="-translate-x-1/2 absolute left-1/2 hidden items-center gap-1 md:flex">
            {columns?.map((column) => {
              if (column.type === "column") {
                return (
                  <DesktopColumnDropdown column={column} key={column._key} />
                );
              }
              if (column.type === "link") {
                return <DesktopColumnLink column={column} key={column._key} />;
              }
              return null;
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <SanityButtons
              buttons={buttons || []}
              className="flex items-center gap-2"
              size="sm"
            />
            <ModeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
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
