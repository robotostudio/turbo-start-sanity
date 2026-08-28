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
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MenuLink } from "@/components/elements/menu-link";
import { Logo } from "@/components/logo";
import type { ColumnLink, NavigationData } from "@/types";

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
  const pathname = usePathname();
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the route-change trigger, not a value the effect body reads.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const { columns, buttons } = navbarData || {};
  const { siteTitle, logos } = settingsData || {};

  return (
    <Drawer
      onOpenChange={handleOpenChange}
      open={isOpen}
      swipeDirection={side === "right" ? "right" : "down"}
    >
      <DrawerTrigger
        render={
          <Button
            className="rounded-none focus-visible:outline-offset-0!"
            size="icon"
            variant="ghost"
          >
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
              <div className="flex flex-row items-center justify-between border-b px-6 py-2.5">
                <DrawerTitle className="sr-only">
                  {siteTitle || "Menu"}
                </DrawerTitle>
                <div className="flex items-center [&_img]:h-5 [&_img]:w-auto [&_img]:rounded-none">
                  <Logo
                    alt={siteTitle ?? "Turbo Start Sanity"}
                    image={logos?.logo}
                    imageDark={logos?.logoDark}
                  />
                </div>
                <DrawerClose
                  render={
                    <Button
                      className="-mr-3 rounded-none focus-visible:outline-offset-0!"
                      size="icon"
                      variant="ghost"
                    >
                      <X className="size-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  }
                />
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
                          aria-current={
                            column.href === pathname ? "page" : undefined
                          }
                          className="hover-surface focus-ring-inset -mx-3 flex items-center rounded-none px-3 py-3 font-light font-mono text-foreground text-sm uppercase tracking-normal"
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
                          <AccordionTrigger className="hover-surface focus-ring-inset -mx-3 rounded-none px-3 py-3 font-light font-mono text-foreground text-sm uppercase tracking-normal hover:no-underline">
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
                <div className="mt-auto grid border-t px-6 py-4">
                  <SanityButtons
                    buttonClassName="w-full justify-center font-mono font-normal text-sm uppercase tracking-wide"
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
