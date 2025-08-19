// types/pokemon.ts
export interface SanityPokemon {
  _type?: "pokemon";
  name?: string;
  id?: number;
  sprite?: string;
  types?: string[];
}

export interface PokemonReference {
  _type?: "reference" | string;
  _ref?: string;
  _id?: string;
  pokemon?: SanityPokemon;
  // Also allow flat structure for flexibility
  name?: string;
  id?: number;
  sprite?: string;
  types?: string[];
}
