"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

/**
 * Sticky-reveal footer — the mirror of the sticky hero. When the footer fits in
 * the viewport it is pinned to the bottom BEHIND the page content; the content
 * scrolls up over it and slides away at the end to reveal it. A pinned element
 * can only ever show what fits on screen, so on viewports shorter than the
 * footer it falls back to a normal in-flow footer (no clipping). The footer's
 * height is measured into `--footer-height` so the content can reserve exactly
 * that much space above it.
 */
export function StickyFooter({ children }: Readonly<{ children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
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

  return (
    <div
      className={pinned ? "fixed inset-x-0 bottom-0 z-0" : "relative z-10"}
      ref={ref}
    >
      {children}
    </div>
  );
}
