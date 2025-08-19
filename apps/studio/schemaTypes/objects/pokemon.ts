// schemaTypes/objects/pokemon.ts
import { defineType, defineField } from "sanity";
import React from "react";

export const pokemonType = defineType({
  name: "pokemon",
  title: "Pokemon",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Pokedex ID", type: "number" }),
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({ name: "sprite", title: "Sprite URL", type: "url" }),
    defineField({
      name: "types",
      title: "Types",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});
