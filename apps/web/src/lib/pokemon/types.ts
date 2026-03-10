export type PokemonType =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type StatName =
  | "hp" | "attack" | "defense"
  | "special-attack" | "special-defense" | "speed";

export type PokemonStat = {
  name: StatName;
  baseStat: number;
};

export type PokemonAbility = {
  name: string;
  isHidden: boolean;
};

export type EvolutionLink = {
  name: string;
  minLevel: number | null;
  trigger: string | null;
  evolvesTo: EvolutionLink[];
};

export type EvolutionChain = {
  id: number;
  root: EvolutionLink;
};

export type PokemonListItem = {
  name: string;
  url: string;
};

export type PokemonSprites = {
  front: string | null;
  frontShiny: string | null;
  official: string | null;
};

export type PokemonSummary = {
  id: number;
  name: string;
  types: PokemonType[];
  sprites: PokemonSprites;
  stats: PokemonStat[];
};

export type PokemonDetail = PokemonSummary & {
  height: number; // in decimetres
  weight: number; // in hectograms
  abilities: PokemonAbility[];
  flavorText: string | null;
  genus: string | null;
  evolutionChain: EvolutionChain;
};


export type RawPokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
  species: { url: string };
};

export type RawSpecies = {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  genera: Array<{ genus: string; language: { name: string } }>;
  evolution_chain: { url: string };
};

export type RawEvolutionChain = {
  id: number;
  chain: RawChainLink;
};

export type RawChainLink = {
  species: { name: string };
  evolution_details: Array<{
    min_level: number | null;
    trigger: { name: string } | null;
  }>;
  evolves_to: RawChainLink[];
};


export type SearchablePokemon = {
  id: number;
  name: string;
  types: PokemonType[];
  typesText: string;
  officialArt: string | null;
};
