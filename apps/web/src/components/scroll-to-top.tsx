"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

// Some link components (e.g. base-ui NavigationMenuLink) bypass the App
// Router's scroll-to-top. Reset scroll on forward navigation, but let the
// browser restore position on back/forward (popstate).
function ScrollToTopInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPopNavigation = useRef(false);
  const hasMounted = useRef(false);

  // Key on pathname + query so a query-only popstate still re-runs the effect
  // to clear the flag; a pathname-only key would strand the next navigation.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const lastRouteKey = useRef(routeKey);

  useEffect(() => {
    const markPop = () => {
      const popped = `${window.location.pathname}?${window.location.search.slice(1)}`;
      if (popped === lastRouteKey.current) {
        return;
      }
      isPopNavigation.current = true;
    };
    window.addEventListener("popstate", markPop);
    return () => window.removeEventListener("popstate", markPop);
  }, []);

  useEffect(() => {
    lastRouteKey.current = routeKey;

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Back/forward: let the browser restore the saved scroll position.
    if (isPopNavigation.current) {
      isPopNavigation.current = false;
      return;
    }
    // Forward navigation: skip in-page hash jumps, otherwise reset to top —
    // which sits one fold below the true top when the hero fold's scroll
    // room is mounted (see hero-fold.tsx).
    if (window.location.hash) {
      return;
    }
    const fold =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--fold-height"
        )
      ) || 0;
    window.scrollTo(0, fold);
  }, [routeKey]);

  return null;
}

export function ScrollToTop() {
  // `useSearchParams` reads request-time data, so it needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ScrollToTopInner />
    </Suspense>
  );
}
