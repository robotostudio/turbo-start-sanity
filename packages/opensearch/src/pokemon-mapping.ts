import { opensearchEnv } from "./env";

export const POKEMON_INDEX = `${opensearchEnv.OPENSEARCH_INDEX}-pokemon`;

export const POKEMON_INDEX_SETTINGS = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    analysis: {
      filter: {
        pokemon_synonyms: {
          type: "synonym",
          synonyms: [
            "electric, lightning, thunder",
            "fire, flame, blaze",
            "water, aqua, hydro",
            "grass, plant, leaf, flora",
            "psychic, psi, mental",
            "ghost, phantom, spirit",
            "dragon, draconic",
            "fairy, fae, pixie",
            "fighting, martial, combat",
            "dark, shadow",
            "steel, metal, iron",
            "ice, frost, frozen",
            "poison, toxic, venom",
            "ground, earth, sand",
            "flying, air, wind",
            "bug, insect",
            "rock, stone",
            "normal, standard",
          ],
        },
        autocomplete_filter: {
          type: "edge_ngram",
          min_gram: 2,
          max_gram: 15,
        },
      },
      analyzer: {
        pokemon_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "pokemon_synonyms"],
        },
        autocomplete_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "autocomplete_filter"],
        },
        autocomplete_search_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase"],
        },
      },
    },
  },
  mappings: {
    properties: {
      pokemonId: { type: "integer" },
      name: {
        type: "text",
        analyzer: "pokemon_analyzer",
        fields: {
          autocomplete: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "autocomplete_search_analyzer",
          },
          keyword: {
            type: "keyword",
          },
        },
      },
      types: { type: "keyword" },
      genus: {
        type: "text",
        analyzer: "pokemon_analyzer",
      },
      flavorText: {
        type: "text",
        analyzer: "pokemon_analyzer",
      },
      generation: { type: "keyword" },
      spriteUrl: { type: "keyword", index: false },
      isLegendary: { type: "boolean" },
      isMythical: { type: "boolean" },
      hp: { type: "integer" },
      attack: { type: "integer" },
      defense: { type: "integer" },
      specialAttack: { type: "integer" },
      specialDefense: { type: "integer" },
      speed: { type: "integer" },
      totalStats: { type: "integer" },
    },
  },
} as const;

export type PokemonDocument = {
  pokemonId: number;
  name: string;
  types: string[];
  genus: string | null;
  flavorText: string | null;
  generation: string;
  spriteUrl: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  totalStats: number;
};
