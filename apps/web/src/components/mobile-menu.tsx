"use client";

import { SanityButtons } from "@workspace/sanity-blocks/internal/sanity-buttons";
import { cn } from "@workspace/tailwind-config/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerPopup,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "@workspace/ui/components/base-drawer";
import { Button } from "@workspace/ui/components/button";
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ColumnLink, NavigationData } from "@/types";
import { MenuLink } from "./elements/menu-link";
import { Logo } from "./logo";

const FOCUS_RING =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

const TABLET_QUERY = "(min-width: 768px) and (max-width: 1024px)";

const VIEWPORT_ANCHOR = {
  bottom: "items-end justify-center",
  right: "items-stretch justify-end",
} as const;

const POPUP_SLIDE = {
  bottom:
    "h-[90dvh] border-t origin-bottom [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-starting-style:[transform:translateY(100%)] data-ending-style:[transform:translateY(100%)]",
  right:
    "h-dvh max-w-md border-s origin-right [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-starting-style:[transform:translateX(100%)] data-ending-style:[transform:translateX(100%)]",
} as const;

export function MobileMenu({
  navbarData,
  settingsData,
}: Readonly<NavigationData>) {
  const [isOpen, setIsOpen] = useState(false);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const liveSide = isTablet ? "right" : "bottom";
  // Freeze the anchor at open-time and keep it for the whole session, so crossing
  // the breakpoint (e.g. a tablet rotation) or closing never re-anchors a visible
  // panel — re-anchoring on close would jump the sheet mid-exit-animation.
  const [side, setSide] = useState<"bottom" | "right">(liveSide);

  function handleOpenChange(next: boolean) {
    if (next) {
      setSide(liveSide);
    }
    setIsOpen(next);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  const { columns, buttons } = navbarData || {};
  const { logo, siteTitle } = settingsData || {};

  return (
    <Drawer
      onOpenChange={handleOpenChange}
      open={isOpen}
      swipeDirection={side === "right" ? "right" : "down"}
    >
      <DrawerTrigger
        render={
          <Button size="icon" variant="ghost">
            <Menu className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />

      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport className={VIEWPORT_ANCHOR[side]}>
          <DrawerPopup
            className={cn(
              "w-full pb-[env(safe-area-inset-bottom)]",
              POPUP_SLIDE[side]
            )}
          >
            <DrawerContent>
              <div className="flex flex-row items-center justify-between border-b px-6 py-4">
                <DrawerTitle className={logo ? "sr-only" : "font-semibold"}>
                  {siteTitle || "Menu"}
                </DrawerTitle>
                {logo ? (
                  <div className="[&_img]:h-6 [&_img]:w-auto [&_img]:rounded-none">
                    <Logo alt={siteTitle || ""} image={logo} />
                  </div>
                ) : null}
                <DrawerClose
                  className={cn(
                    "rounded-sm opacity-70 transition-opacity hover:opacity-100",
                    FOCUS_RING
                  )}
                >
                  <X className="size-5" />
                  <span className="sr-only">Close</span>
                </DrawerClose>
              </div>

              <nav
                aria-label="Main"
                className="grid flex-1 content-start gap-1 overflow-y-auto px-6 pt-4"
              >
                <Accordion>
                  {columns?.map((column) => {
                    if (column.type === "link") {
                      if (!column.href) {
                        return null;
                      }
                      return (
                        <Link
                          className={cn(
                            "-mx-3 flex items-center rounded-md px-3 py-3 font-medium text-sm transition-colors hover:text-primary",
                            FOCUS_RING
                          )}
                          href={column.href}
                          key={column._key}
                          onClick={closeMenu}
                        >
                          {column.name}
                        </Link>
                      );
                    }

                    if (column.type === "column") {
                      return (
                        <AccordionItem
                          className="border-b-0"
                          key={column._key}
                          value={column._key}
                        >
                          <AccordionTrigger className="-mx-3 px-3 py-3 hover:no-underline">
                            {column.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="ml-1 grid gap-1 border-border border-l-2 pl-4">
                              {column.links?.map(
                                (link: Readonly<ColumnLink>) => (
                                  <MenuLink
                                    description={link.description || ""}
                                    href={link.href || ""}
                                    icon={link.icon}
                                    key={link._key}
                                    name={link.name || ""}
                                    onClick={closeMenu}
                                  />
                                )
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }

                    return null;
                  })}
                </Accordion>
              </nav>

              {buttons?.length ? (
                <div className="mt-auto grid gap-2 border-t p-4">
                  <SanityButtons
                    buttonClassName="w-full justify-center"
                    buttons={buttons || []}
                    className="grid gap-3"
                  />
                </div>
              ) : null}
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
