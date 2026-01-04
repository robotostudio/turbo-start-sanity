"use client";

import {cn} from "@repo/ui/lib/utils";
import {ChevronDown} from "lucide-react";
import Link from "next/link";
import {useState} from "react";

import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@/lib/sanity/sanity.types";
import {LucideIcon} from "./elements/lucide-icon";

// Type helpers using utility types
type NavigationData = {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
};

type NavColumn = NonNullable<
  NonNullable<QueryNavbarDataResult>["columns"]
>[number];

type ColumnLink = Extract<NavColumn, {type: "column"}>["links"] extends Array<
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

function MenuLink({name, href, description, onClick}: MenuLinkProps) {
  return (
    <Link
      className="group flex items-start gap-3 transition-colors hover:bg-accent"
      href={href || "#"}
      onClick={onClick}
    >
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

function ColumnDropdown({
  column,
}: {
  column: Extract<NavColumn, {type: "column"}>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="group relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex w-full items-center justify-between gap-1 py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground md:w-auto md:justify-start md:py-0"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        type="button"
      >
        {column.title}
        <LucideIcon
          className={cn(
            "transition-transform",
            isOpen && "rotate-180",
            "md:group-hover:rotate-180"
          )}
          icon={ChevronDown}
        />
      </button>
      {isOpen ? (
        <div
          className="fade-in-0 zoom-in-95 z-50 min-w-[280px] animate-in rounded-lg border bg-popover p-2 shadow-lg md:absolute md:left-0 md:top-full"
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

function ColumnLink({
  column,
}: {
  column: Extract<NavColumn, {type: "link"}>;
}) {
  return (
    <Link
      className="px-3 py-2 font-medium text-base text-muted-foreground transition-colors hover:text-foreground md:px-3 md:py-2"
      href={column.href || "#"}
    >
      {column.name}
    </Link>
  );
}

export function Navbar({navbarData, settingsData}: NavigationData) {
  const {columns} = navbarData || {};
  const {logo, siteTitle} = settingsData || {};

  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex h-10 w-max items-center">
            <div>
              <Link
                className="font-medium font-twelve-serif text-xl"
                href={"/"}
              >
                {siteTitle}
              </Link>
            </div>
          </div>

          {/* Hidden checkbox for mobile menu state */}
          <input
            className="peer hidden"
            id="mobile-menu-toggle"
            type="checkbox"
          />

          {/* Mobile menu toggle label */}
          <label
            className="cursor-pointer font-medium text-sm md:hidden peer-checked:[&_.menu-text]:hidden peer-checked:[&_.close-text]:inline"
            htmlFor="mobile-menu-toggle"
          >
            <span className="menu-text inline">Menu</span>
            <span className="close-text hidden">Close</span>
          </label>

          {/* Navigation - shared between mobile and desktop */}
          <nav className="fixed right-0 top-16 z-50 hidden h-auto max-h-[calc(100vh-4rem)] w-64 origin-top-right scale-95 flex-col gap-4 overflow-y-auto rounded-bl-lg border bg-background p-6 opacity-0 shadow-lg transition-all duration-200 peer-checked:flex peer-checked:scale-100 peer-checked:opacity-100 md:relative md:right-auto md:top-auto md:flex md:h-auto md:max-h-none md:w-auto md:scale-100 md:flex-row md:gap-6 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:opacity-100 md:shadow-none">
            {columns?.map((column) => {
              if (column.type === "column") {
                return <ColumnDropdown column={column} key={column._key} />;
              }
              if (column.type === "link") {
                return <ColumnLink column={column} key={column._key} />;
              }
              return null;
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
