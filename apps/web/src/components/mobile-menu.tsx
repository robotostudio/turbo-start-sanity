"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
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
    setOpenDropdown((curr) => (curr === key ? null : key));
  }

  function closeMenu() {
    setIsOpen(false);
    setOpenDropdown(null);
  }

  const { columns, buttons } = navbarData || {};
  const { logo, siteTitle } = settingsData || {};

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" variant="ghost">
          <Menu className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto" showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between pb-4 border-b">
          {logo ? (
            <div className="[&_img]:w-auto [&_img]:h-6 [&_img]:rounded-none">
              <Logo alt={siteTitle || ""} image={logo} />
            </div>
          ) : (
            <SheetTitle>{siteTitle || "Menu"}</SheetTitle>
          )}
          <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col gap-4 pt-4 flex-1 overflow-y-auto">
          {/* Navigation items */}
          <nav className="grid gap-2">
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
                  <div className="grid gap-1" key={column._key}>
                    <button
                      className="flex items-center justify-between py-2 font-medium text-sm transition-colors hover:text-primary"
                      onClick={() => toggleDropdown(column._key)}
                      type="button"
                    >
                      {column.title}
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isDropdownOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div className="grid gap-1 border-border border-l-2 pl-4 ml-1">
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
          </nav>

          {/* Action buttons */}
          <div className="grid gap-3 border-t pt-4">
            <div className="flex justify-start">
              <ModeToggle />
            </div>
            <SanityButtons
              buttonClassName="w-full justify-center"
              buttons={buttons || []}
              className="grid gap-3"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
