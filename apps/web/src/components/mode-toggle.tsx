"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { id: 'light', value: 'light', label: 'Light' },
  { id: 'dark', value: 'dark', label: 'Dark' },
  { id: 'system', value: 'system', label: 'System' },
] as const

export function ModeToggle() {
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-xl" size="icon" variant="ghost">
          <Sun className="dark:-rotate-90 rotate-0 scale-100 transition-all dark:scale-0" />
          <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map(({ id, value, label }) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setTheme(value)}
            className="flex justify-between items-center"
            aria-current={mounted && theme === value ? "true" : undefined}
          >
            {label}
            {mounted && theme === value && <Check className="w-4 h-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
