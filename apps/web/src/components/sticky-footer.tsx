"use client";

import { cn } from "@workspace/tailwind-config/utils";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Layout effect in the browser (measure before paint), plain effect on the
// server to avoid React's SSR "useLayoutEffect does nothing" warning.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Scroll offset of the mark's first stroke, measured up from the bottom of the
// page — mirrors the `mark-frame` range start in globals.css.
const MARK_START = 320;
// Scroll px per ms past which the ~490px sequence crosses in under 400ms and
// the scrubbed build never reads. Set above a smooth-scrolled wheel notch.
const FAST_SCROLL = 1.2;

/** Pinned behind the page content and revealed as it scrolls up, or in-flow
 * when too tall. Publishes `--footer-height` so content reserves space. */
export function StickyFooter({ children }: Readonly<{ children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  // Default to pinned so SSR and first paint agree (no relative→fixed hydration
  // flip / CLS). The effect only flips to in-flow when the footer is too tall.
  const [pinned, setPinned] = useState(true);
  // A top rubber-band moves the content but not this fixed box, flashing green
  // under the navbar. Only fix: don't paint it — a cover sits in the same gap.
  const [coveredAtTop, setCoveredAtTop] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const root = document.documentElement;
    const update = () => {
      const height = el.offsetHeight;
      const fits = height > 0 && height <= window.innerHeight;
      if (fits) {
        root.style.setProperty("--footer-height", `${height}px`);
        setPinned(true);
      } else {
        root.style.removeProperty("--footer-height");
        setPinned(false);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty("--footer-height");
    };
  }, []);

  useEffect(() => {
    if (!pinned) {
      setCoveredAtTop(false);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      // A page with nothing to scroll shows the footer at rest — never hide it.
      const scrollable = root.scrollHeight - window.innerHeight > 2;
      setCoveredAtTop(scrollable && window.scrollY <= 0);
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pinned]);

  // Real-time playback when the mark is crossed too fast to scrub, handed back
  // on the way up. Pinned only — in flow the range uses the CSS fallback.
  useEffect(() => {
    const el = ref.current;
    if (!pinned || !el) {
      return;
    }
    const root = document.documentElement;
    let lastY = window.scrollY;
    let lastAt = performance.now();
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const at = performance.now();
      const start =
        root.scrollHeight - window.innerHeight - el.offsetHeight + MARK_START;
      const speed = Math.abs(y - lastY) / Math.max(at - lastAt, 1);
      if (y < lastY) {
        root.removeAttribute("data-mark-play");
      } else if (lastY < start && y >= start && speed > FAST_SCROLL) {
        // Only on the tick that crosses the first stroke, while nothing is
        // drawn: swapping mid-build would rewind a stroke already in place.
        root.dataset.markPlay = "fast";
      }
      lastY = y;
      lastAt = at;
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      root.removeAttribute("data-mark-play");
    };
  }, [pinned]);

  return (
    <div
      className={cn(
        pinned
          ? "fixed inset-x-0 bottom-0 z-0 [transform:translateZ(0)]"
          : "relative z-10",
        coveredAtTop && "opacity-0"
      )}
      ref={ref}
    >
      {children}
    </div>
  );
}
