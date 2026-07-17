"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

// useLayoutEffect warns during SSR; fall back to useEffect on the server so the
// initial measurement still runs client-side before paint without the warning.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const EDGE_DURATION_MS = 500;
const TRAIL_DELAY_MS = 90;
// Fast start, long soft landing.
const LEAD_EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
// Gentle overshoot on the trailing edge so the pill settles onto the target.
const SETTLE_EASE = "cubic-bezier(0.34, 1.2, 0.5, 1)";

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const prevIndexRef = useRef<number | null>(null);
  const prevInsetsRef = useRef<{ left: number; right: number } | null>(null);

  const activeIndex = Math.max(
    0,
    THEMES.findIndex(({ value }) => value === theme)
  );

  // Measure the button's real box and move the pill onto it. The slide uses
  // the Web Animations API instead of CSS transitions because next-themes'
  // disableTransitionOnChange injects a global `* { transition: none }` at the
  // exact moment the theme flips, which would kill a CSS transition mid-move.
  // Both insets animate: the leading edge heads out immediately while the
  // trailing edge is delayed, so the pill stretches then contracts onto the
  // target.
  const positionPill = useCallback((index: number) => {
    const el = buttonRefs.current[index];
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!(el && container && pill)) {
      return;
    }
    const left = el.offsetLeft;
    const right = container.clientWidth - (el.offsetLeft + el.offsetWidth);
    const prevIndex = prevIndexRef.current;
    const prevInsets = prevInsetsRef.current;
    prevIndexRef.current = index;
    prevInsetsRef.current = { left, right };

    // Inline styles are the resting state; animations play on top of them.
    pill.style.left = `${left}px`;
    pill.style.right = `${right}px`;

    if (
      prevIndex === null ||
      prevIndex === index ||
      !prevInsets ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Cancel snaps to the inline resting style so rapid clicks restart clean.
    for (const animation of pill.getAnimations()) {
      animation.cancel();
    }

    const lead = { duration: EDGE_DURATION_MS, easing: LEAD_EASE };
    const trail = {
      duration: EDGE_DURATION_MS,
      easing: SETTLE_EASE,
      delay: TRAIL_DELAY_MS,
      // Hold the old position through the delay — this creates the stretch.
      fill: "backwards" as const,
    };
    const movingRight = index > prevIndex;
    pill.animate(
      [{ left: `${prevInsets.left}px` }, { left: `${left}px` }],
      movingRight ? trail : lead
    );
    pill.animate(
      [{ right: `${prevInsets.right}px` }, { right: `${right}px` }],
      movingRight ? lead : trail
    );
  }, []);

  // Position the pill before the first paint (it fades in via opacity) so
  // every later move animates from a valid position. Mount-only — subsequent
  // moves go through the passive effect below.
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
    positionPill(
      Math.max(
        0,
        THEMES.findIndex(({ value }) => value === theme)
      )
    );
  }, [positionPill]);

  useEffect(() => {
    if (mounted) {
      positionPill(activeIndex);
    }
  }, [activeIndex, mounted, positionPill]);

  return (
    <div
      className="relative flex items-center rounded-full border border-accent-green-foreground/40"
      ref={containerRef}
    >
      {/* A single flat pill that stretches toward the selected option
          (WAAPI, see positionPill). */}
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-8 rounded-full bg-accent-green-foreground transition-opacity duration-150 ease-out",
          mounted ? "opacity-100" : "opacity-0"
        )}
        ref={pillRef}
      />
      {THEMES.map(({ value, label, Icon }, index) => {
        const active = mounted && theme === value;
        return (
          <button
            aria-label={`Switch to ${label} theme`}
            aria-pressed={active}
            className={cn(
              "focus-ring-inset relative z-10 rounded-full p-2 transition-colors duration-150 ease-out",
              active
                ? "focus-visible:outline-accent-green!"
                : "hover:bg-accent-green-foreground/10 focus-visible:outline-accent-green-foreground!"
            )}
            key={value}
            onClick={() => setTheme(value)}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
          >
            <Icon
              className={cn(
                "size-4 transition-colors duration-150 ease-out",
                active ? "text-accent-green" : "text-accent-green-foreground/70"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
