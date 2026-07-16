"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// The App Router scrolls to top on navigation for plain `next/link`, but some
// link components (e.g. the base-ui NavigationMenuLink used in the navbar)
// bypass that. Reset scroll on forward route changes, but preserve the browser's
// native scroll restoration on back/forward (popstate) so returning to a page
// keeps its previous scroll position instead of jumping to the top.
export function ScrollToTop() {
  const pathname = usePathname();
  const isPopNavigation = useRef(false);

  useEffect(() => {
    const markPop = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener("popstate", markPop);
    return () => window.removeEventListener("popstate", markPop);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a route-change trigger, not read inside the effect body.
  useEffect(() => {
    // Back/forward: let the browser restore the saved scroll position.
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      return;
    }
    // Forward navigation: skip in-page hash jumps, otherwise reset to top.
    if (window.location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
