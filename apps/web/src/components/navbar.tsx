"use client";

import {Button} from "@workspace/ui/components/button";
import {cn} from "@workspace/ui/lib/utils";
import {ChevronDown, Menu, X} from "lucide-react";
import Link from "next/link";
import {useCallback, useEffect, useState} from "react";

import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@/lib/sanity/sanity.types";
import {LucideIcon} from "./elements/lucide-icon";
import {Logo} from "./logo";

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
  onLinkClick,
}: {
  column: Extract<NavColumn, {type: "column"}>;
  onLinkClick?: () => void;
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
                onClick={onLinkClick}
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
  onLinkClick,
}: {
  column: Extract<NavColumn, {type: "link"}>;
  onLinkClick?: () => void;
}) {
  return (
    <Link
      className="px-3 py-2 font-medium text-base text-muted-foreground transition-colors hover:text-foreground md:px-3 md:py-2"
      href={column.href || "#"}
      onClick={onLinkClick}
    >
      {column.name}
    </Link>
  );
}

export function Navbar({navbarData, settingsData}: NavigationData) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {columns} = navbarData || {};
  const {logo, siteTitle} = settingsData || {};

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  function toggleMobileMenu() {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4">
        <div className="flex h-16 max-w-prose items-center justify-between">
          {/* Logo */}
          <div className="flex h-10 w-[120px] items-center">
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

          {/* Mobile menu button */}
          <Button
            className="md:hidden"
            onClick={toggleMobileMenu}
            size="icon"
            variant="ghost"
          >
            {isMobileMenuOpen ? (
              <LucideIcon icon={X} />
            ) : (
              <LucideIcon icon={Menu} />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <button
              className="fixed inset-0 top-16 z-50 bg-black/50 md:hidden"
              onClick={closeMobileMenu}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  closeMobileMenu();
                }
              }}
              type="button"
            >
              <span className="sr-only">Close menu</span>
            </button>
          )}
          {isMobileMenuOpen && (
            <div className="fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-full border-r bg-background p-6 shadow-lg md:hidden">
              <nav className="flex flex-col gap-4">
                {columns?.map((column) => {
                  if (column.type === "column") {
                    return (
                      <ColumnDropdown
                        column={column}
                        key={column._key}
                        onLinkClick={closeMobileMenu}
                      />
                    );
                  }
                  if (column.type === "link") {
                    return (
                      <ColumnLink
                        column={column}
                        key={column._key}
                        onLinkClick={closeMobileMenu}
                      />
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden items-center justify-between gap-16 md:flex">
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
