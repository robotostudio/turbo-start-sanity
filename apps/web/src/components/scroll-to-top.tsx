"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// The App Router scrolls to top on navigation for plain `next/link`, but some
// link components (e.g. the base-ui NavigationMenuLink used in the navbar)
// bypass that. Reset scroll on every route change, skipping in-page hash jumps.
export function ScrollToTop() {
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a route-change trigger, not read inside the effect body.
  useEffect(() => {
    if (window.location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
