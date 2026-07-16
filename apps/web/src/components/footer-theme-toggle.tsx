"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function FooterThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center rounded-full border border-accent-green-foreground/20 p-0.5">
      {THEMES.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            aria-label={`Switch to ${label} theme`}
            aria-pressed={active}
            className={
              active
                ? "focus-ring rounded-full bg-accent-green-foreground p-2 transition-colors focus-visible:outline-accent-green-foreground!"
                : "focus-ring rounded-full p-2 transition-colors hover:bg-accent-green-foreground/10 focus-visible:outline-accent-green-foreground!"
            }
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <Icon
              className={
                active
                  ? "size-4 text-accent-green"
                  : "size-4 text-accent-green-foreground/70"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
