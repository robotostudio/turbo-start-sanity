"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

import { ALL_TYPES } from "@/lib/pokemon/constants";
import type { PokemonType } from "@/lib/pokemon/types";

type TypeFilterProps = {
  activeType: PokemonType | null;
};

export function TypeFilter({ activeType }: TypeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setType = useCallback(
    (type: PokemonType | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (type) {
        params.set("type", type);
      } else {
        params.delete("type");
      }
      params.delete("page"); // reset to page 1 on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setType(null)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          activeType === null
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-muted"
        }`}
      >
        All
      </button>
      {ALL_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setType(t)}
          className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
            activeType === t
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
