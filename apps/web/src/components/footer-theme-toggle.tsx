"use client";

import { cn } from "@workspace/tailwind-config/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure the active button's real position so the sliding pill lands exactly
  // on it, independent of border/padding math or next-themes' resolve timing.
  useEffect(() => {
    if (!mounted) {
      return;
    }
    const index = THEMES.findIndex(({ value }) => value === theme);
    const el = buttonRefs.current[index];
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [theme, mounted]);

  return (
    <div className="relative flex items-center rounded-full border border-accent-green-foreground/40">
      {/* A single active pill that SLIDES to the selected option instead of each
          button toggling its own background. */}
      <span
        aria-hidden="true"
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-8 rounded-full bg-accent-green-foreground transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          pill ? "opacity-100" : "opacity-0"
        )}
        style={pill ? { left: pill.left, width: pill.width } : undefined}
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
