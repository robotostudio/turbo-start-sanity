"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Rest position: one hero fold below the document top (0 without a fold).
function restTop() {
  return (
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--hero-fold")
    ) || 0
  );
}

function scrollToRest(top: number, animate: boolean) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: animate && !reduced ? "smooth" : "auto" });
}

// Some link components (e.g. base-ui NavigationMenuLink) bypass the App
// Router's scroll-to-top. Reset scroll on forward navigation, but let the
// browser restore position on back/forward (popstate).
function ScrollToTopInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPopNavigation = useRef(false);
  const hasMounted = useRef(false);
  // Set while a browser-restored position is landing, so the spring below
  // leaves it alone (restoration ends in a `scrollend` like any scroll).
  const restoringUntil = useRef(0);

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
    const markRestore = () => {
      restoringUntil.current = Date.now() + 1000;
    };
    // Only a bfcache `pageshow` restores a position; the one every fresh load
    // fires would silence the park retry for a second — when the streamed-in
    // hero, and the fold it carries, is still arriving.
    const markBfCache = (event: PageTransitionEvent) => {
      if (event.persisted) {
        markRestore();
      }
    };
    window.addEventListener("popstate", markPop);
    window.addEventListener("popstate", markRestore);
    window.addEventListener("pageshow", markBfCache);
    return () => {
      window.removeEventListener("popstate", markPop);
      window.removeEventListener("popstate", markRestore);
      window.removeEventListener("pageshow", markBfCache);
    };
  }, []);

  // Spring back to rest once a scroll settles inside the fold's strip — the
  // scroll-snap it replaces yanked normal downward scrolling back too.
  useEffect(() => {
    const settle = () => {
      const fold = restTop();
      if (Date.now() < restoringUntil.current) {
        return;
      }
      if (fold > 0 && window.scrollY < fold) {
        scrollToRest(fold, true);
      }
    };
    window.addEventListener("scrollend", settle);
    return () => window.removeEventListener("scrollend", settle);
  }, []);

  // Park below the fold on first load, pre-paint so the strip never shows and
  // jumps. Retried because the fold arrives with the hero, which streams in
  // behind draft mode's Suspense boundary, and because scroll restoration can
  // land inside the strip after this runs.
  useIsomorphicLayoutEffect(() => {
    if (window.location.hash) {
      return;
    }
    const park = () => {
      const fold = restTop();
      if (fold > 0 && window.scrollY < fold) {
        scrollToRest(fold, false);
      }
      return fold;
    };
    park();
    const deadline = Date.now() + 3000;
    const timer = window.setInterval(() => {
      if (
        window.scrollY > park() ||
        Date.now() > deadline ||
        Date.now() < restoringUntil.current
      ) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
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
    // Forward navigation: skip in-page hash jumps, otherwise reset to rest.
    if (window.location.hash) {
      return;
    }
    scrollToRest(restTop(), false);
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
