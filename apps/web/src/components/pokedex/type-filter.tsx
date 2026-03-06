import Link from "next/link";

import { POKEMON_TYPES, TYPE_COLORS, type PokemonTypeName } from "@/lib/pokeapi/types";

type TypeFilterProps = {
  currentType: string | undefined;
};

export function TypeFilter({ currentType }: TypeFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <Link
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            !currentType
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
          href="/pokedex"
        >
          All Types
        </Link>

        {POKEMON_TYPES.map((type) => {
          const isActive = currentType === type;
          const colorClass = TYPE_COLORS[type as PokemonTypeName];

          return (
            <Link
              key={type}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                isActive
                  ? `${colorClass} border-transparent shadow-sm`
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
              href={`/pokedex?type=${type}`}
            >
              {type}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
