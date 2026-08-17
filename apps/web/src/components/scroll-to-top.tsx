"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Wait after the page stops moving before easing back. Below ~40ms the
// release starts firing inside gestures, which shakes.
const RELEASE_DELAY = 90;

// Time constant of the return: ~90% of the way back by 400ms, settled by 650.
const RELEASE_TAU = 115;

// The rate eases in over this, so the return never starts at full speed.
const RELEASE_RAMP = 150;

// How far the page must diverge from the frame just painted to count as the
// reader taking over, rather than a momentum tail nudging it.
const TAKEOVER_PX = 40;

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
  // eases back to rest. Driven per frame rather than by `scrollTo({behavior:
  // "smooth"})`, which a fling's momentum cancels — that left the page sitting
  // on the strip for as long as the tail ran, then finishing in a second jump.
  useEffect(() => {
    let timer = 0;
    let frame = 0;
    let painted = -1;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      painted = -1;
    };

    const release = () => {
      const fold = restTop();
      if (frame || fold === 0 || window.scrollY >= fold) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, fold);
        return;
      }
      let last = performance.now();
      let ramp = 0;
      painted = window.scrollY;

      const step = (now: number) => {
        const target = restTop();
        const y = window.scrollY;
        // Only a downward divergence is the reader taking over. Upward means
        // the browser's elastic spring still owns the scroll, and treating
        // that as input is what cancelled the release mid-flight.
        if (y > painted + TAKEOVER_PX || y >= target) {
          stop();
          return;
        }
        const dt = Math.min(50, now - last);
        last = now;
        // Ramp only on frames the page actually moved, so a release armed
        // inside the spring waits it out at a standstill and then starts from
        // zero speed, instead of arriving at the curve's peak velocity.
        if (y > painted - 1) {
          ramp = Math.min(1, ramp + dt / RELEASE_RAMP);
        }
        // Approach from where the page really is, never from a remembered
        // start: a frame the spring ate then costs nothing to recover from.
        const closed = 1 - Math.exp((-dt / RELEASE_TAU) * ramp);
        painted = Math.min(target, y + Math.max(1, (target - y) * closed));
        window.scrollTo(0, painted);
        frame = target - painted < 1 ? 0 : requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const runRelease = () => {
      timer = 0;
      release();
    };

    // Movement pushes the wait back — the reader is still scrolling.
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(runRelease, RELEASE_DELAY);
    };

    // A tail only ever starts the wait. Extending it on wheels that move
    // nothing is what left the page sitting on the strip for the length of the
    // fling; `step`'s takeover check is what makes starting early safe.
    const armOnce = () => {
      if (!timer) {
        timer = window.setTimeout(runRelease, RELEASE_DELAY);
      }
    };

    // Takeover is judged in `step` against the frame it just painted; a
    // scroll handler can't tell our own writes from the reader's.
    window.addEventListener("scroll", arm, { passive: true });
    // A tail keeps firing wheels after the page has stopped, with no `scroll`
    // behind them — without this the release would never be armed at all.
    window.addEventListener("wheel", armOnce, { passive: true });
    return () => {
      stop();
      window.clearTimeout(timer);
      window.removeEventListener("scroll", arm);
      window.removeEventListener("wheel", armOnce);
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
