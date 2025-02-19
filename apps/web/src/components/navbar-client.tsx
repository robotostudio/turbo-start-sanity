"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Sheet, SheetTrigger } from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";
import type { QueryNavbarDataResult } from "@/lib/sanity/sanity.types";

import { Logo } from "./logo";
import { SanityButtons } from "./sanity-buttons";
import { SanityIcon } from "./sanity-icon";

interface MenuItem {
  title: string;
  description: string;
  icon: JSX.Element;
  href?: string;
}

function MenuItemLink({
  item,
  setIsOpen,
}: {
  item: MenuItem;
  setIsOpen?: (isOpen: boolean) => void;
}) {
  return (
    <Link
      className={cn(
        "flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground items-center focus:bg-accent focus:text-accent-foreground",
      )}
      aria-label={`Link to ${item.title ?? item.href}`}
      onClick={() => setIsOpen?.(false)}
      href={item.href ?? "/"}
    >
      {item.icon}
      <div className="">
        <div className="text-sm font-semibold">{item.title}</div>
        <p className="text-sm leading-snug text-muted-foreground line-clamp-2">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function MobileNavbarAccordionColumn({
  column,
  setIsOpen,
}: {
  column: NonNullable<NonNullable<QueryNavbarDataResult>["columns"]>[number];
  setIsOpen: (isOpen: boolean) => void;
}) {
  if (column.type !== "column") return null;
  return (
    <AccordionItem value={column.title ?? column._key} className="border-b-0">
      <AccordionTrigger className="mb-4 py-0 font-semibold hover:no-underline hover:bg-accent hover:text-accent-foreground pr-2 rounded-md">
        <div
          className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
        >
          {column.title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="mt-2">
        {column.links?.map((item) => (
          <MenuItemLink
            key={item._key}
            setIsOpen={setIsOpen}
            item={{
              description: item.description ?? "",
              href: item.href ?? "",
              icon: <SanityIcon icon={item.icon} className="size-5 shrink-0" />,
              title: item.name ?? "",
            }}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

function MobileNavbar({ navbarData }: { navbarData: QueryNavbarDataResult }) {
  const { logo, siteTitle, columns, buttons } = navbarData ?? {};
  const [isOpen, setIsOpen] = useState(false);

  const path = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is intentional
  useEffect(() => {
    setIsOpen(false);
  }, [path]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-end">
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo src={logo} alt={siteTitle} priority />
          </SheetTitle>
        </SheetHeader>

        <div className="mb-8 mt-8 flex flex-col gap-4">
          {columns?.map((column) => {
            if (column.type === "link") {
              return (
                <Link
                  key={`column-link-${column.name}-${column._key}`}
                  href={column.href ?? ""}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start",
                  )}
                >
                  {column.name}
                </Link>
              );
            }
            return (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                key={column._key}
              >
                <MobileNavbarAccordionColumn
                  column={column}
                  setIsOpen={setIsOpen}
                />
              </Accordion>
            );
          })}
        </div>

        <div className="border-t pt-4">
          <SanityButtons
            buttons={buttons ?? []}
            buttonClassName="w-full"
            className="flex mt-2 flex-col gap-3"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NavbarColumnLink({
  column,
}: {
  column: NonNullable<NonNullable<QueryNavbarDataResult>["columns"]>[number];
}) {
  if (column.type !== "link") return null;
  return (
    <Link
      aria-label={`Link to ${column.name ?? column.href}`}
      href={column.href ?? ""}
      legacyBehavior
      passHref
    >
      <NavigationMenuLink
        className={cn(navigationMenuTriggerStyle(), "text-muted-foreground")}
      >
        {column.name}
      </NavigationMenuLink>
    </Link>
  );
}

function NavbarColumn({
  column,
}: {
  column: NonNullable<NonNullable<QueryNavbarDataResult>["columns"]>[number];
}) {
  if (column.type !== "column") return null;
  return (
    <NavigationMenuList>
      <NavigationMenuItem className="text-muted-foreground">
        <NavigationMenuTrigger>{column.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            {column.links?.map((item) => (
              <li key={item._key}>
                <MenuItemLink
                  item={{
                    description: item.description ?? "",
                    href: item.href ?? "",
                    icon: (
                      <SanityIcon
                        icon={item.icon}
                        className="size-5 shrink-0"
                      />
                    ),
                    title: item.name ?? "",
                  }}
                />
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}

export function DesktopNavbar({
  navbarData,
}: {
  navbarData: QueryNavbarDataResult;
}) {
  const { columns, buttons } = navbarData ?? {};

  return (
    <div className="flex items-start justify-between w-full">
      <div className="flex items-center">
        <NavigationMenu>
          {columns?.map((column) =>
            column.type === "column" ? (
              <NavbarColumn key={`column-${column._key}`} column={column} />
            ) : (
              <NavbarColumnLink
                key={`column-link-${column.name}-${column._key}`}
                column={column}
              />
            ),
          )}
        </NavigationMenu>
      </div>
      <SanityButtons
        buttons={buttons ?? []}
        className="flex gap-2 ml-auto"
        buttonClassName="rounded-[10px]"
      />
    </div>
  );
}

const ClientSideNavbar = ({
  navbarData,
}: {
  navbarData: QueryNavbarDataResult;
}) => {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return null; // Return null on initial render to avoid hydration mismatch
  }

  return isMobile ? (
    <MobileNavbar navbarData={navbarData} />
  ) : (
    <DesktopNavbar navbarData={navbarData} />
  );
};

function SkeletonMobileNavbar() {
  return (
    <div className="md:hidden">
      <div className="flex justify-end">
        <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden md:flex items-center justify-between w-full">
      <div className="flex items-center gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-desktop-navbar-${i.toString()}`}
            className="h-8 w-24 bg-muted rounded animate-pulse"
          />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`skeleton-desktop-navbar-${i.toString()}`}
            className="h-12 w-32 bg-muted rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function NavbarSkeletonResponsive() {
  return (
    <>
      <SkeletonMobileNavbar />
      <SkeletonDesktopNavbar />
    </>
  );
}

// Dynamically import the navbar with no SSR to avoid hydration issues
export const NavbarClient = dynamic(() => Promise.resolve(ClientSideNavbar), {
  ssr: false,
  loading: () => <NavbarSkeletonResponsive />,
});
