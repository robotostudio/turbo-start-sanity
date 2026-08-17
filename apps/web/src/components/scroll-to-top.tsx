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
  // Driven per frame rather than by `scrollTo({behavior: "smooth"})`: a flick's
  // momentum cancels the browser's smooth scroll without firing another
  // `scrollend`, which left the page stranded mid-strip.
  useEffect(() => {
    let frame = 0;
    let idle = 0;
    let painted = -1;
    // A held finger owns the position; springing under it fights the drag.
    let touching = false;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      painted = -1;
    };

    const springTo = (target: number) => {
      const from = window.scrollY;
      const distance = target - from;
      if (Math.abs(distance) < 1) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, target);
        return;
      }
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / 320);
        // Eased out, never past the target: an overshooting curve reads as a
        // bounce against the fold's edge.
        painted = Math.round(from + distance * (1 - (1 - progress) ** 3));
        window.scrollTo(0, painted);
        frame = progress < 1 ? requestAnimationFrame(step) : 0;
      };
      frame = requestAnimationFrame(step);
    };

    const settle = () => {
      const fold = restTop();
      if (frame || touching || Date.now() < restoringUntil.current) {
        return;
      }
      if (fold > 0 && window.scrollY < fold) {
        springTo(fold);
      }
    };

    // Every path that cancels the spring re-arms it. A gesture's tail (wheel
    // events still arriving while the page sits pinned at the strip, so no
    // `scroll` follows) otherwise cancelled with nothing left to restart it,
    // stranding the page mid-strip.
    const arm = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(settle, 120);
    };

    const takeOver = () => {
      stop();
      arm();
    };

    const onScroll = () => {
      // A scroll that isn't the frame this effect just painted is the reader's.
      if (frame && Math.abs(window.scrollY - painted) > 2) {
        stop();
      }
      arm();
    };

    const onTouchStart = () => {
      touching = true;
      stop();
    };

    const onTouchEnd = () => {
      touching = false;
      arm();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", takeOver, { passive: true });
    window.addEventListener("keydown", takeOver);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      stop();
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", takeOver);
      window.removeEventListener("keydown", takeOver);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  // Park below the fold on first load, pre-paint so the strip never shows and
  // jumps. Retried only until the fold has a height — it arrives with the
  // hero, which streams in behind draft mode's Suspense boundary — then stops
  // for good, leaving the strip to the spring above. Kept running, its instant
  // jumps every 100ms fought that animation.
  useIsomorphicLayoutEffect(() => {
    if (window.location.hash) {
      return;
    }
    const park = () => {
      const fold = restTop();
      if (fold === 0) {
        return false;
      }
      if (window.scrollY < fold) {
        scrollToRest(fold, false);
      }
      return true;
    };
    if (park()) {
      return;
    }
    const deadline = Date.now() + 3000;
    const timer = window.setInterval(() => {
      if (park() || Date.now() > deadline) {
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
