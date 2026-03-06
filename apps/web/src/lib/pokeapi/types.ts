export type PokeAPIPokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny: string | null;
      };
      dream_world?: {
        front_default: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: { name: string; url: string };
  }>;
  stats: Array<{
    base_stat: number;
    stat: { name: string; url: string };
  }>;
  abilities: Array<{
    is_hidden: boolean;
    ability: { name: string; url: string };
  }>;
  species: { name: string; url: string };
};

export type PokeAPISpecies = {
  id: number;
  name: string;
  evolution_chain: { url: string };
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
  generation: { name: string; url: string };
  color: { name: string };
  habitat: { name: string } | null;
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  base_happiness: number;
  growth_rate: { name: string };
};

export type PokeAPIEvolutionChain = {
  id: number;
  chain: EvolutionChainLink;
};

export type EvolutionChainLink = {
  species: { name: string; url: string };
  evolution_details: Array<{
    trigger: { name: string };
    min_level: number | null;
    item: { name: string } | null;
    held_item: { name: string } | null;
    min_happiness: number | null;
    min_affection: number | null;
    time_of_day: string;
    known_move: { name: string } | null;
    known_move_type: { name: string } | null;
    location: { name: string } | null;
    gender: number | null;
    needs_overworld_rain: boolean;
    trade_species: { name: string } | null;
    turn_upside_down: boolean;
  }>;
  evolves_to: EvolutionChainLink[];
};

export type PokeAPIListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ name: string; url: string }>;
};

export type PokeAPIType = {
  id: number;
  name: string;
  pokemon: Array<{
    pokemon: { name: string; url: string };
    slot: number;
  }>;
};

export type PokemonStat = {
  name: string;
  abbr: string;
  value: number;
};

export type PokemonAbility = {
  name: string;
  isHidden: boolean;
};

export type PokemonType = {
  slot: number;
  name: string;
};

export type EvolutionNode = {
  name: string;
  spriteUrl: string | null;
  trigger: string | null;
  triggerDetail: string | null;
  children: EvolutionNode[];
};

export type PokemonListItem = {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: PokemonType[];
  stats: PokemonStat[];
};

export type PokemonDetail = {
  id: number;
  name: string;
  height: number;
  weight: number;
  spriteUrl: string | null;
  artworkUrl: string | null;
  shinySpriteUrl: string | null;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  species: {
    genus: string | null;
    flavorText: string | null;
    generation: string;
    color: string;
    habitat: string | null;
    isLegendary: boolean;
    isMythical: boolean;
    captureRate: number;
    baseHappiness: number;
    growthRate: string;
  };
  evolutionChain: EvolutionNode;
};

export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];

export const TYPE_COLORS: Record<PokemonTypeName, string> = {
  normal: "bg-stone-400 text-white",
  fire: "bg-orange-500 text-white",
  water: "bg-blue-500 text-white",
  electric: "bg-yellow-400 text-black",
  grass: "bg-green-500 text-white",
  ice: "bg-cyan-300 text-black",
  fighting: "bg-red-700 text-white",
  poison: "bg-purple-500 text-white",
  ground: "bg-amber-600 text-white",
  flying: "bg-indigo-300 text-black",
  psychic: "bg-pink-500 text-white",
  bug: "bg-lime-500 text-white",
  rock: "bg-yellow-700 text-white",
  ghost: "bg-purple-700 text-white",
  dragon: "bg-indigo-600 text-white",
  dark: "bg-stone-700 text-white",
  steel: "bg-slate-400 text-white",
  fairy: "bg-pink-300 text-black",
};

/** Stat name → abbreviated label */
export const STAT_ABBR: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "Spe",
};
