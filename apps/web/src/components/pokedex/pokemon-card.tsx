import Link from "next/link";

import type { PokemonListItem } from "@/lib/pokeapi/types";
import { StatBar } from "./stat-bar";
import { TypeBadge } from "./type-badge";

type PokemonCardProps = {
  pokemon: PokemonListItem;
};

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <Link
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
      href={`/pokedex/${pokemon.name}`}
    >
      <span className="absolute top-2 right-3 font-bold text-muted-foreground/20 text-sm">
        #{String(pokemon.id).padStart(3, "0")}
      </span>

      <div className="flex items-center justify-center bg-muted/30 p-4 transition-colors group-hover:bg-muted/50">
        {pokemon.spriteUrl ? (
          <img
            alt={pokemon.name}
            className="h-28 w-28 object-contain drop-shadow-md transition-transform group-hover:scale-110"
            height={112}
            loading="lazy"
            src={pokemon.spriteUrl}
            width={112}
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-2xl text-muted-foreground">
            ?
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold capitalize">{pokemon.name.replace(/-/g, " ")}</h3>

        <div className="mt-2 flex gap-1.5">
          {pokemon.types.map((type) => (
            <TypeBadge key={type.name} size="sm" type={type.name} />
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          {pokemon.stats.map((stat) => (
            <StatBar key={stat.name} stat={stat} />
          ))}
        </div>
      </div>
    </Link>
  );
}
