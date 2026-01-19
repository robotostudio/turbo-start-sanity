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
import { SanityButtons } from "./elements/sanity-buttons";
import { SanityIcon } from "./elements/sanity-icon";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";

type NavigationData = {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
};

type NavColumn = NonNullable<
  NonNullable<QueryNavbarDataResult>["columns"]
>[number];

type ColumnLink =
  Extract<NavColumn, { type: "column" }>["links"] extends Array<infer T>
    ? T
    : never;

type MenuLinkProps = {
  name: string;
  href: string;
  description?: string;
  icon?: string | null;
  onClick?: () => void;
};

function MenuLink({ name, href, description, icon, onClick }: MenuLinkProps) {
  return (
    <Link
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
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

export function MobileMenu({ navbarData, settingsData }: NavigationData) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  function toggleDropdown(key: string) {
    setOpenDropdown(openDropdown === key ? null : key);
  }

  function closeMenu() {
    setIsOpen(false);
    setOpenDropdown(null);
  }

  const { columns, buttons } = navbarData || {};
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
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background/80 backdrop-blur-sm md:hidden">
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
                          <ChevronDown
                            className={cn(
                              "size-3 transition-transform",
                              isDropdownOpen && "rotate-180",
                            )}
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

              {/* Action buttons */}
              <div className="grid gap-3 border-t pt-4">
                <div className="flex justify-center">
                  <ModeToggle />
                </div>
                <SanityButtons
                  buttonClassName="w-full justify-center"
                  buttons={buttons || []}
                  className="grid gap-3"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
