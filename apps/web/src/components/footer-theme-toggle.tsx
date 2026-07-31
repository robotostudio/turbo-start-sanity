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

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pillRef = useRef<HTMLSpanElement | null>(null);

  const activeIndex = Math.max(
    0,
    THEMES.findIndex(({ value }) => value === theme)
  );

  const positionPill = useCallback((index: number) => {
    const el = buttonRefs.current[index];
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!(el && container && pill)) {
      return;
    }
    pill.style.left = `${el.offsetLeft}px`;
    pill.style.right = `${container.clientWidth - (el.offsetLeft + el.offsetWidth)}px`;
  }, []);

  // Before paint, so the pill is already under the active button on the frame
  // it fades in on — and on every later theme change, so it never lags.
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
    positionPill(activeIndex);
  }, [activeIndex, positionPill]);

  return (
    <div
      className="relative flex items-center rounded-full border border-accent-green-foreground/40"
      ref={containerRef}
    >
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-8 rounded-full bg-accent-green-foreground",
          // `left`/`right` rather than a transform: the pill resizes to each
          // segment's width, and only the inset pair carries both at once.
          // Skipped on the mount frame, or it flies in from the left edge.
          mounted
            ? "opacity-100 transition-[left,right] duration-300 ease-[var(--ease-spring)] motion-reduce:transition-none"
            : "opacity-0"
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
                "size-4",
                active ? "text-accent-green" : "text-accent-green-foreground/70"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
