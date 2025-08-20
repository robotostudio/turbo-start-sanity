// types/pokemon.ts
export interface PokemonResult {
  _type: "pokemon"; // add this so it's directly usable in Sanity
  id: number;
  name: string;
  sprite: string;
  types: string[];
}
