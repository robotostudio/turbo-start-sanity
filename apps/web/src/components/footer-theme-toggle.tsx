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

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-8 rounded-full bg-accent-green-foreground",
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
