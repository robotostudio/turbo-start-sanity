"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useSyncExternalStore } from "react";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
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
  const pillRef = useRef<HTMLSpanElement | null>(null);

  // Ref on the active button, so it runs before paint whenever active moves.
  const placePill = (el: HTMLButtonElement | null) => {
    const pill = pillRef.current;
    if (el && pill) {
      pill.style.left = `${el.offsetLeft}px`;
      pill.style.width = `${el.offsetWidth}px`;
    }
  };

  return (
    <div className="relative grid grid-flow-col items-center rounded-full border border-accent-green-foreground/40">
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-8 rounded-full bg-accent-green-foreground",
          // `!` beats the transition kill from `disableTransitionOnChange`.
          "motion-safe:transition-[left,width]! motion-safe:duration-300! motion-safe:ease-[var(--ease-spring)]!",
          // hidden until placed so the pill doesn't fly in from the left.
          !mounted && "hidden"
        )}
        ref={pillRef}
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
            ref={active ? placePill : undefined}
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
