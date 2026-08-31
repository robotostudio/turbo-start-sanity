"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@workspace/tailwind-config/utils";
import type * as React from "react";

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger(
  props: React.ComponentProps<typeof DrawerPrimitive.Trigger>
) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(
  props: React.ComponentProps<typeof DrawerPrimitive.Close>
) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

const DrawerPortal = DrawerPrimitive.Portal;

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn("font-medium text-foreground", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

function DrawerBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-background/95",
        "opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-300 ease-out motion-reduce:transition-none",
        "supports-[-webkit-touch-callout:none]:absolute",
        "data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      data-slot="drawer-backdrop"
      {...props}
    />
  );
}

function DrawerViewport({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Viewport>) {
  return (
    <DrawerPrimitive.Viewport
      className={cn("fixed inset-0 z-50 flex", className)}
      data-slot="drawer-viewport"
      {...props}
    />
  );
}

function DrawerPopup({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup>) {
  return (
    <DrawerPrimitive.Popup
      className={cn(
        // The sheet still slides for everyone else; reduced motion gets the
        // same open/closed states with the travel removed.
        "relative flex flex-col overflow-hidden overscroll-contain bg-background text-foreground outline-none transition-transform duration-340 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none data-swiping:select-none data-swiping:duration-0",
        className
      )}
      data-slot="drawer-popup"
      {...props}
    />
  );
}

function DrawerContent({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPrimitive.Content
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      data-slot="drawer-content"
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerPopup,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
};
