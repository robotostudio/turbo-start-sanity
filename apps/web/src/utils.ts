import type { PortableTextBlock } from "next-sanity";
import slugify from "slugify";
import type { SanityPokemon } from "../src/types/pokemon";

export const isRelativeUrl = (url: string) =>
  url.startsWith("/") || url.startsWith("#") || url.startsWith("?");

export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.log(e);
    return isRelativeUrl(url);
  }
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const getTitleCase = (name: string) => {
  const titleTemp = name.replace(/([A-Z])/g, " $1");
  return titleTemp.charAt(0).toUpperCase() + titleTemp.slice(1);
};

type Response<T> = [T, undefined] | [undefined, string];

export async function handleErrors<T>(
  promise: Promise<T>,
): Promise<Response<T>> {
  try {
    const data = await promise;
    return [data, undefined];
  } catch (err) {
    return [
      undefined,
      err instanceof Error ? err.message : JSON.stringify(err),
    ];
  }
}

export function convertToSlug(
  text?: string,
  { fallback }: { fallback?: string } = { fallback: "top-level" },
) {
  if (!text) return fallback;
  return slugify(text.trim(), {
    lower: true,
    remove: /[^a-zA-Z0-9 ]/g,
  });
}

export function parseChildrenToSlug(children: PortableTextBlock["children"]) {
  if (!children) return "";
  return convertToSlug(children.map((child) => child.text).join(""));
}

export function cleanPokemonName(name?: string): string | null {
  if (!name) return null;

  return (
    name
      // Remove zero-width spaces, non-breaking spaces, and other invisible characters
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "")
      // Remove any remaining non-printable characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      // Keep only letters, numbers, spaces, hyphens, and apostrophes
      .replace(/[^\w\s\-']/g, "")
      .trim()
      .toLowerCase() || null
  );
}

/**
 * Cleans Pokemon type by removing invisible characters
 */
export function cleanPokemonType(type?: string): string | null {
  if (!type) return null;

  return (
    type
      .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "")
      .replace(/[^\w]/g, "")
      .trim()
      .toLowerCase() || null
  );
}

/**
 * Cleans entire Pokemon data object
 */
export function cleanPokemonData(
  pokemon?: SanityPokemon | null,
): SanityPokemon | null {
  if (!pokemon) return null;

  const cleanName = cleanPokemonName(pokemon.name);
  if (!cleanName) return null;

  return {
    ...pokemon,
    name: cleanName,
    types:
      pokemon.types
        ?.map(cleanPokemonType)
        .filter((type): type is string => Boolean(type)) || [],
  };
}

/**
 * Validates if Pokemon data is complete and valid
 */
export function isValidPokemon(pokemon?: SanityPokemon | null): boolean {
  if (!pokemon) return false;

  const cleanName = cleanPokemonName(pokemon.name);
  return Boolean(cleanName && (pokemon.id || pokemon.sprite));
}
