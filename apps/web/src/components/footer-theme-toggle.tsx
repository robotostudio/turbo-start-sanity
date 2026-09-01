"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

// Segments are equal width, so the pill slides by multiples of its own width.
const PILL_OFFSETS = [
  "translate-x-0",
  "translate-x-full",
  "translate-x-[200%]",
] as const;

// theme is client-only; render neutral until hydrated.
const emptySubscribe = () => () => {
  // nothing to unsubscribe
};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const activeIndex = Math.max(
    0,
    THEMES.findIndex(({ value }) => value === theme)
  );

  return (
    <div className="relative flex items-center rounded-full border border-accent-green-foreground/40">
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 left-0 h-8 w-1/3 rounded-full bg-accent-green-foreground",
          // `!` beats the transition kill from `disableTransitionOnChange`.
          "motion-safe:transition-transform! motion-safe:duration-300! motion-safe:ease-[var(--ease-spring)]!",
          // hidden until mounted so the pill doesn't fly in from the left.
          mounted ? PILL_OFFSETS[activeIndex] : "hidden"
        )}
      />
      {THEMES.map(({ value, label, Icon }) => {
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
