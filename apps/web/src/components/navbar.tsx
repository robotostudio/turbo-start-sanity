"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@/lib/sanity/sanity.types";

import { LucideIcon } from "./elements/lucide-icon";
import { SanityIcon } from "./elements/sanity-icon";
import { Logo } from "./logo";

// Type helpers using utility types
type NavigationData = {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
};

type NavColumn = NonNullable<
  NonNullable<QueryNavbarDataResult>["columns"]
>[number];

type ColumnLink = Extract<NavColumn, { type: "column" }>["links"] extends Array<
  infer T
>
  ? T
  : never;

type MenuLinkProps = {
  name: string;
  href: string;
  description?: string;
  icon?:
    | {
        svg?: string | null;
        name?: string | null;
      }
    | string
    | null;
  onClick?: () => void;
};

function MenuLink({ name, href, description, icon, onClick }: MenuLinkProps) {
  return (
    <Link
      className="group flex items-start gap-3 transition-colors hover:bg-accent"
      href={href || "#"}
      onClick={onClick}
    >
      {icon && (
        <SanityIcon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          icon={icon}
        />
      )}
      <div className="grid gap-1">
        <div className="font-medium leading-none group-hover:text-accent-foreground">
          {name}
        </div>
        {description && (
          <div className="line-clamp-2 text-muted-foreground text-sm">
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}

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
        className="flex items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        type="button"
      >
        {column.title}
        <LucideIcon
          className="transition-transform group-hover:rotate-180"
          icon={ChevronDown}
        />
      </button>
      {isOpen ? (
        <div
          className="fade-in-0 zoom-in-95 absolute top-full left-0 z-50 min-w-[280px] animate-in rounded-lg border bg-popover p-2 shadow-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menu"
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
  return (
    <Link
      className="px-3 py-2 font-medium text-base text-muted-foreground transition-colors hover:text-foreground"
      href={column.href || "#"}
    >
      {column.name}
    </Link>
  );
}

function MobileMenu({ navbarData, settingsData }: NavigationData) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  function toggleDropdown(key: string) {
    setOpenDropdown(openDropdown === key ? null : key);
  }

  function closeMenu() {
    setIsOpen(false);
    setOpenDropdown(null);
  }

  const { columns } = navbarData || {};
  const { logo, siteTitle } = settingsData || {};

  return (
    <>
      {/* Mobile menu button */}
      <Button
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        variant="ghost"
      >
        {isOpen ? <LucideIcon icon={X} /> : <LucideIcon icon={Menu} />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden">
          <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-full border-r bg-background p-6 shadow-lg">
            <div className="grid gap-6">
              {/* Logo for mobile */}
              {logo && (
                <div className="flex justify-center border-b pb-4">
                  <Logo
                    alt={siteTitle || ""}
                    height={40}
                    image={logo}
                    width={120}
                  />
                </div>
              )}

              {/* Navigation items */}
              <div className="grid gap-4">
                {columns?.map((column) => {
                  if (column.type === "link") {
                    return (
                      <Link
                        className="flex items-center py-2 font-medium text-sm transition-colors hover:text-primary"
                        href={column.href || "#"}
                        key={column._key}
                        onClick={closeMenu}
                      >
                        {column.name}
                      </Link>
                    );
                  }

                  if (column.type === "column") {
                    const isDropdownOpen = openDropdown === column._key;
                    return (
                      <div className="grid gap-2" key={column._key}>
                        <button
                          className="flex items-center justify-between py-2 font-medium text-sm transition-colors hover:text-primary"
                          onClick={() => toggleDropdown(column._key)}
                          type="button"
                        >
                          {column.title}
                          <LucideIcon
                            className={cn(
                              "transition-transform",
                              isDropdownOpen && "rotate-180"
                            )}
                            icon={ChevronDown}
                          />
                        </button>
                        {isDropdownOpen && (
                          <div className="grid gap-1 border-border border-l-2 pl-4">
                            {column.links?.map((link: ColumnLink) => (
                              <MenuLink
                                description={link.description || ""}
                                href={link.href || ""}
                                icon={link.icon}
                                key={link._key}
                                name={link.name || ""}
                                onClick={closeMenu}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Navbar({ navbarData, settingsData }: NavigationData) {
  const { columns } = navbarData || {};
  const { logo, siteTitle } = settingsData || {};

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4">
        <div className="flex h-16 max-w-prose items-center justify-between">
          {/* Logo */}
          <div className="flex h-[40px] w-[120px] items-center">
            {logo ? (
              <Logo
                alt={siteTitle || ""}
                height={40}
                image={logo}
                priority
                width={120}
              />
            ) : (
              <div>
                <Link
                  className="font-medium font-twelve-serif text-xl"
                  href={"/"}
                >
                  {siteTitle}
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center justify-between gap-16 md:flex">
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

          {/* Mobile Menu */}
          <MobileMenu navbarData={navbarData} settingsData={settingsData} />
        </div>
      </div>
    </header>
  );
}
