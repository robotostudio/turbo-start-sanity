import type { PokemonListItem } from "@/lib/pokeapi/types";
import { PokemonCard } from "./pokemon-card";

type PokemonGridProps = {
  pokemon: PokemonListItem[];
};

export function PokemonGrid({ pokemon }: PokemonGridProps) {
  if (pokemon.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">No Pokémon found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pokemon.map((p) => (
        <PokemonCard key={p.id} pokemon={p} />
      ))}
    </div>
  );
}
