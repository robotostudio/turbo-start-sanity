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

/**
 * Sticky-reveal footer: when it fits the viewport it's pinned to the bottom
 * behind the page content, which scrolls up to reveal it. On viewports shorter
 * than the footer it falls back to a normal in-flow footer. Its height is
 * measured into `--footer-height` so the content reserves space above it.
 */
export function StickyFooter({ children }: Readonly<{ children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  // Default to pinned so SSR and first paint agree (no relative→fixed hydration
  // flip / CLS). The effect only flips to in-flow when the footer is too tall.
  const [pinned, setPinned] = useState(true);
  // At the top the footer is fully covered, yet still painted — and a rubber-band
  // translates the content and sticky navbar away while a fixed element stays
  // put, flashing accent green under the translucent navbar. Not painting it is
  // the only reliable fix: `overscroll-behavior: none` kills the bounce and macOS
  // Safari ignores it, and a cover can't help since the gap opens over the
  // footer's own box.
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
