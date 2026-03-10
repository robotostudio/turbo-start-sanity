import type { PokemonType } from "@/lib/pokemon/types";

export const TYPE_COLOURS: Record<PokemonType, string> = {
  normal: "bg-stone-400 text-white",
  fire: "bg-orange-500 text-white",
  water: "bg-blue-500 text-white",
  electric: "bg-yellow-400 text-black",
  grass: "bg-green-500 text-white",
  ice: "bg-cyan-300 text-black",
  fighting: "bg-red-700 text-white",
  poison: "bg-purple-500 text-white",
  ground: "bg-amber-600 text-white",
  flying: "bg-indigo-400 text-white",
  psychic: "bg-pink-500 text-white",
  bug: "bg-lime-500 text-white",
  rock: "bg-yellow-700 text-white",
  ghost: "bg-violet-700 text-white",
  dragon: "bg-indigo-700 text-white",
  dark: "bg-neutral-800 text-white",
  steel: "bg-slate-400 text-white",
  fairy: "bg-pink-300 text-black",
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "Spe",
};

export const ALL_TYPES: PokemonType[] = Object.keys(TYPE_COLOURS) as PokemonType[];

export const POKEMON_PER_PAGE = 20;
