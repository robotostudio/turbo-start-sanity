"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Wait after the page stops moving before easing back. Below ~40ms the
// release starts firing inside gestures, which shakes.
const RELEASE_DELAY = 90;

// Rest position: one hero fold below the document top (0 without a fold).
function restTop() {
  return (
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--hero-fold")
    ) || 0
  );
}

function parkAtRest() {
  const fold = restTop();
  if (fold > 0 && window.scrollY < fold) {
    window.scrollTo(0, fold);
  }
  return fold > 0;
}

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

  // Park below the fold on first load, pre-paint so the strip never shows and
  // jumps. Retried briefly: the fold arrives with the hero, which streams in
  // behind draft mode's Suspense boundary.
  useIsomorphicLayoutEffect(() => {
    if (window.location.hash || parkAtRest()) {
      return;
    }
    const timer = window.setInterval(parkAtRest, 100);
    window.setTimeout(() => window.clearInterval(timer), 2000);
    return () => window.clearInterval(timer);
  }, []);

  // Overscrolling into the fold is free; once the page stops moving there, it
  // eases back to rest. Re-armed by every scroll, so a release the reader
  // interrupts simply happens again when they stop.
  useEffect(() => {
    let timer = 0;
    const release = () => {
      const fold = restTop();
      if (fold > 0 && window.scrollY < fold) {
        window.scrollTo({ top: fold, behavior: "smooth" });
      }
    };
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(release, RELEASE_DELAY);
    };
    window.addEventListener("scroll", arm, { passive: true });
    // Wheels push the wait back as well as start it: a fling's momentum keeps
    // firing them after the page has stopped, and releasing into it means the
    // momentum cancels the release, yanks back, and it runs a second time.
    window.addEventListener("wheel", arm, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", arm);
      window.removeEventListener("wheel", arm);
    };
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
    window.scrollTo(0, restTop());
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
