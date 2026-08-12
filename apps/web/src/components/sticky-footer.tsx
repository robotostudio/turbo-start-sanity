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
  const pinnedRef = useRef(true);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const root = document.documentElement;
    const update = () => {
      const height = el.offsetHeight;
      if (height === 0) {
        return;
      }
      // Overflowing the viewport unpins immediately — pinned, the footer is
      // `fixed bottom-0`, so anything past the viewport is clipped off the top
      // and unreachable. The 24px only guards the way back in, so a footer
      // hovering on the boundary can't flip on every resize tick.
      const fits = height <= root.clientHeight - (pinnedRef.current ? 0 : 24);
      pinnedRef.current = fits;
      if (fits) {
        root.style.setProperty("--footer-height", `${height}px`);
      } else {
        root.style.removeProperty("--footer-height");
      }
      setPinned(fits);
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
    const el = ref.current;
    if (!el) {
      return;
    }
    const root = document.documentElement;
    let frame = 0;
    let showing = false;
    // The strip behind Safari's toolbar is canvas, so it takes the ROOT's
    // background — `body` alone never reaches it. But the canvas is one
    // surface, so the same green also lands in the strip behind the notch;
    // `background-attachment: fixed` would separate them and iOS treats it as
    // `scroll`. Hence the wait until the footer owns the whole screen, where
    // green at the notch is the footer itself rather than a wash over the
    // section above. Measured from scroll rather than the footer's rect —
    // pinned it is `fixed`, so its box spans the viewport the whole way down
    // while the content still covers it.
    const ownsScreen = () =>
      root.scrollHeight - root.clientHeight - window.scrollY <
      Math.max(el.offsetHeight - root.clientHeight, 0) + 8;
    const update = () => {
      frame = 0;
      const onFooter = ownsScreen();
      if (onFooter === showing) {
        return;
      }
      showing = onFooter;
      const surface = onFooter ? "var(--accent-green)" : "";
      document.body.style.background = surface;
      root.style.background = surface;
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.body.style.background = "";
      root.style.background = "";
    };
  }, []);

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
        root.scrollHeight - root.clientHeight - el.offsetHeight + MARK_START;
      const speed = Math.abs(y - lastY) / Math.max(at - lastAt, 1);
      if (y < lastY) {
        delete root.dataset.markPlay;
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
      delete root.dataset.markPlay;
    };
  }, [pinned]);

  return (
    <div
      className={cn(
        pinned
          ? "footer-pinned fixed inset-x-0 bottom-0 z-0 transform-[translateZ(0)] before:absolute before:inset-x-0 before:bottom-full before:h-screen before:bg-background before:content-[''] after:absolute after:inset-x-0 after:top-full after:h-svh after:bg-accent-green after:content-['']"
          : "relative z-10"
      )}
      ref={ref}
    >
      {children}
    </div>
  );
}
