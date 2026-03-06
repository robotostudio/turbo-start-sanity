import "server-only";

import { cachedFetch, warmCache } from "./cache";
import {
  STAT_ABBR,
  type EvolutionChainLink,
  type EvolutionNode,
  type PokeAPIEvolutionChain,
  type PokeAPIListResponse,
  type PokeAPIPokemon,
  type PokeAPISpecies,
  type PokemonDetail,
  type PokemonListItem,
  type PokemonStat,
  type PokemonType,
} from "./types";

const BASE_URL = "https://pokeapi.co/api/v2";

async function fetchPokemon(nameOrId: string | number): Promise<PokeAPIPokemon> {
  return cachedFetch<PokeAPIPokemon>(`${BASE_URL}/pokemon/${nameOrId}`);
}

async function fetchSpecies(nameOrId: string | number): Promise<PokeAPISpecies> {
  return cachedFetch<PokeAPISpecies>(`${BASE_URL}/pokemon-species/${nameOrId}`);
}

async function fetchEvolutionChain(url: string): Promise<PokeAPIEvolutionChain> {
  return cachedFetch<PokeAPIEvolutionChain>(url);
}

async function fetchPokemonList(
  offset: number,
  limit: number,
): Promise<PokeAPIListResponse> {
  return cachedFetch<PokeAPIListResponse>(
    `${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`,
  );
}

function spriteUrl(pokemon: PokeAPIPokemon): string | null {
  return (
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.front_default
  );
}

function artworkUrl(pokemon: PokeAPIPokemon): string | null {
  return pokemon.sprites.other?.["official-artwork"]?.front_default ?? null;
}

function normaliseTypes(pokemon: PokeAPIPokemon): PokemonType[] {
  return pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => ({ slot: t.slot, name: t.type.name }));
}

function normaliseStats(pokemon: PokeAPIPokemon): PokemonStat[] {
  return pokemon.stats.map((s) => ({
    name: s.stat.name,
    abbr: STAT_ABBR[s.stat.name] ?? s.stat.name,
    value: s.base_stat,
  }));
}

function getEnglishFlavorText(species: PokeAPISpecies): string | null {
  const entry = species.flavor_text_entries.find(
    (e) => e.language.name === "en",
  );
  return entry
    ? entry.flavor_text
        .replace(/\f/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : null;
}

function getEnglishGenus(species: PokeAPISpecies): string | null {
  return species.genera.find((g) => g.language.name === "en")?.genus ?? null;
}

function formatTrigger(
  detail: EvolutionChainLink["evolution_details"][number],
): { trigger: string; triggerDetail: string | null } {
  const trigger = detail.trigger.name;
  const parts: string[] = [];

  if (detail.min_level) parts.push(`Level ${detail.min_level}`);
  if (detail.item) parts.push(`Use ${detail.item.name.replace(/-/g, " ")}`);
  if (detail.held_item)
    parts.push(`Hold ${detail.held_item.name.replace(/-/g, " ")}`);
  if (detail.min_happiness) parts.push(`Happiness ≥ ${detail.min_happiness}`);
  if (detail.min_affection) parts.push(`Affection ≥ ${detail.min_affection}`);
  if (detail.time_of_day) parts.push(`at ${detail.time_of_day}`);
  if (detail.known_move)
    parts.push(`Know ${detail.known_move.name.replace(/-/g, " ")}`);
  if (detail.location)
    parts.push(`at ${detail.location.name.replace(/-/g, " ")}`);
  if (detail.needs_overworld_rain) parts.push("in rain");
  if (detail.trade_species)
    parts.push(`Trade for ${detail.trade_species.name}`);
  if (detail.turn_upside_down) parts.push("turn upside down");

  if (trigger === "trade" && parts.length === 0) parts.push("Trade");
  if (trigger === "level-up" && parts.length === 0) parts.push("Level up");

  return {
    trigger,
    triggerDetail: parts.length > 0 ? parts.join(", ") : null,
  };
}

async function buildEvolutionTree(
  link: EvolutionChainLink,
): Promise<EvolutionNode> {
  // Get sprite for this species
  let sprite: string | null = null;
  try {
    const id = extractIdFromUrl(link.species.url);
    const pokemon = await fetchPokemon(id);
    sprite = spriteUrl(pokemon);
  } catch {
  }

  const detail = link.evolution_details[0];
  const { trigger, triggerDetail } = detail
    ? formatTrigger(detail)
    : { trigger: null, triggerDetail: null };

  const children = await Promise.all(
    link.evolves_to.map((child) => buildEvolutionTree(child)),
  );

  return {
    name: link.species.name,
    spriteUrl: sprite,
    trigger,
    triggerDetail,
    children,
  };
}

function extractIdFromUrl(url: string): number {
  const parts = url.replace(/\/$/, "").split("/");
  return Number.parseInt(parts[parts.length - 1]!, 10);
}


export async function getPokemonList(
  page: number,
  limit = 24,
): Promise<{
  pokemon: PokemonListItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const offset = (page - 1) * limit;
  const listResponse = await fetchPokemonList(offset, limit);

  const urls = listResponse.results.map(
    (p) => `${BASE_URL}/pokemon/${p.name}`,
  );
  await warmCache(urls);

  const pokemon = await Promise.all(
    listResponse.results.map(async (entry): Promise<PokemonListItem> => {
      const data = await fetchPokemon(entry.name);
      return {
        id: data.id,
        name: data.name,
        spriteUrl: spriteUrl(data),
        types: normaliseTypes(data),
        stats: normaliseStats(data),
      };
    }),
  );

  return {
    pokemon,
    total: listResponse.count,
    page,
    totalPages: Math.ceil(listResponse.count / limit),
  };
}

export async function getPokemonDetail(
  name: string,
): Promise<PokemonDetail> {
  const [pokemon, species] = await Promise.all([
    fetchPokemon(name),
    fetchSpecies(name),
  ]);

  const evoChain = await fetchEvolutionChain(species.evolution_chain.url);
  const evolutionTree = await buildEvolutionTree(evoChain.chain);

  return {
    id: pokemon.id,
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,
    spriteUrl: spriteUrl(pokemon),
    artworkUrl: artworkUrl(pokemon),
    shinySpriteUrl: pokemon.sprites.front_shiny,
    types: normaliseTypes(pokemon),
    stats: normaliseStats(pokemon),
    abilities: pokemon.abilities.map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    })),
    species: {
      genus: getEnglishGenus(species),
      flavorText: getEnglishFlavorText(species),
      generation: species.generation.name,
      color: species.color.name,
      habitat: species.habitat?.name ?? null,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
      captureRate: species.capture_rate,
      baseHappiness: species.base_happiness,
      growthRate: species.growth_rate.name,
    },
    evolutionChain: evolutionTree,
  };
}

export async function searchPokemonByName(
  query: string,
  limit = 10,
): Promise<PokemonListItem[]> {
  const allList = await cachedFetch<PokeAPIListResponse>(
    `${BASE_URL}/pokemon?offset=0&limit=1302`,
  );

  const q = query.toLowerCase();
  const matches = allList.results
    .filter((p) => p.name.includes(q))
    .slice(0, limit);

  const urls = matches.map((m) => `${BASE_URL}/pokemon/${m.name}`);
  await warmCache(urls);

  return Promise.all(
    matches.map(async (entry): Promise<PokemonListItem> => {
      const data = await fetchPokemon(entry.name);
      return {
        id: data.id,
        name: data.name,
        spriteUrl: spriteUrl(data),
        types: normaliseTypes(data),
        stats: normaliseStats(data),
      };
    }),
  );
}

/**
 * Get all Pokemon of a specific type. Used for type-based filtering.
 */
export async function getPokemonByType(
  typeName: string,
  page: number,
  limit = 24,
): Promise<{
  pokemon: PokemonListItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const typeData = await cachedFetch<{
    pokemon: Array<{ pokemon: { name: string; url: string } }>;
  }>(`${BASE_URL}/type/${typeName}`);

  const total = typeData.pokemon.length;
  const offset = (page - 1) * limit;
  const pageSlice = typeData.pokemon.slice(offset, offset + limit);

  const urls = pageSlice.map((p) => p.pokemon.url);
  await warmCache(urls);

  const pokemon = await Promise.all(
    pageSlice.map(async (entry): Promise<PokemonListItem> => {
      const data = await cachedFetch<PokeAPIPokemon>(entry.pokemon.url);
      return {
        id: data.id,
        name: data.name,
        spriteUrl: spriteUrl(data),
        types: normaliseTypes(data),
        stats: normaliseStats(data),
      };
    }),
  );

  return {
    pokemon,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
