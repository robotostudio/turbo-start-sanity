// schemas/documents/pokedex.ts
import { defineType, defineField } from "sanity";
import { PokemonSearchInput } from "../../components/PokemonSearchInput";

export const pokedex = defineType({
  name: "pokedex",
  title: "Pokédex",
  type: "document",
  fields: [
    defineField({
      name: "pokemon",
      type: "object",
      title: "Pokémon",
      components: {
        input: PokemonSearchInput, // Reuse your search component
      },
      fields: [
        defineField({ name: "id", type: "number", readOnly: true }),
        defineField({ name: "name", type: "string", readOnly: true }),
        defineField({ name: "sprite", type: "url", readOnly: true }),
        defineField({
          name: "types",
          type: "array",
          of: [{ type: "string" }],
          readOnly: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "pokemon.name",
      sprite: "pokemon.sprite",
    },
  },
});
