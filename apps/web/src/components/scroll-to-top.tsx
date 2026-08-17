"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Wait after the page stops moving before easing back. Below ~40ms the
// release starts firing inside gestures, which shakes.
const RELEASE_DELAY = 90;

// How long to wait for the fold to exist. A draft-mode preview streams the
// hero in behind Suspense with the cache off; give up too early and the slot
// grows under a page still at 0, stranding it on the strip.
const FOLD_WAIT = 10_000;

// Kept parking this long after the fold appears, so Safari's own scroll
// restoration — which lands after the layout effect — can't win the last word.
const PARK_GRACE = 1000;

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
  // jumps.
  useIsomorphicLayoutEffect(() => {
    if (window.location.hash) {
      return;
    }
    parkAtRest();
    let firstParkAt = 0;
    const giveUpAt = Date.now() + FOLD_WAIT;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const fold = restTop();
      // Gave up, or the reader has scrolled past the strip themselves.
      if (now > giveUpAt || window.scrollY > fold) {
        window.clearInterval(timer);
        return;
      }
      if (fold === 0) {
        return;
      }
      parkAtRest();
      firstParkAt = firstParkAt || now;
      if (now - firstParkAt > PARK_GRACE) {
        window.clearInterval(timer);
      }
    }, 100);
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
