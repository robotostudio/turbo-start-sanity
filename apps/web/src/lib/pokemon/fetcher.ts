import type {
  EvolutionChain,
  EvolutionLink,
  PokemonDetail,
  PokemonListItem,
  PokemonSummary,
  RawEvolutionChain,
  RawChainLink,
  RawPokemon,
  RawSpecies,
} from "./types";

const BASE = "https://pokeapi.co/api/v2";
const REVALIDATE = 3600; // 1 hour

const warmCache = new Map<string, unknown>();

async function pokeGet<T>(url: string): Promise<T> {
  if (warmCache.has(url)) {
    return warmCache.get(url) as T;
  }

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) {
    throw new Error(`PokeAPI ${res.status}: ${url}`);
  }

  const data = (await res.json()) as T;
  warmCache.set(url, data);
  return data;
}

function parseEvolutionLink(link: RawChainLink): EvolutionLink {
  const details = link.evolution_details[0];
  return {
    name: link.species.name,
    minLevel: details?.min_level ?? null,
    trigger: details?.trigger?.name ?? null,
    evolvesTo: link.evolves_to.map(parseEvolutionLink),
  };
}

function parseSummary(raw: RawPokemon): PokemonSummary {
  return {
    id: raw.id,
    name: raw.name,
    types: raw.types.map((t) => t.type.name) as PokemonSummary["types"],
    sprites: {
      front: raw.sprites.front_default,
      frontShiny: raw.sprites.front_shiny,
      official: raw.sprites.other?.["official-artwork"]?.front_default ?? null,
    },
    stats: raw.stats.map((s) => ({
      name: s.stat.name as PokemonSummary["stats"][number]["name"],
      baseStat: s.base_stat,
    })),
  };
}


export async function fetchPokemonList(
  limit = 20,
  offset = 0
): Promise<{ results: PokemonListItem[]; count: number }> {
  const data = await pokeGet<{ results: PokemonListItem[]; count: number }>(
    `${BASE}/pokemon?limit=${limit}&offset=${offset}`
  );
  return data;
}

export async function fetchPokemonSummary(name: string): Promise<PokemonSummary> {
  const raw = await pokeGet<RawPokemon>(`${BASE}/pokemon/${name}`);
  return parseSummary(raw);
}

export async function fetchPokemonDetail(name: string): Promise<PokemonDetail> {
  const raw = await pokeGet<RawPokemon>(`${BASE}/pokemon/${name}`);
  const species = await pokeGet<RawSpecies>(raw.species.url);

  const flavorEntry = species.flavor_text_entries.find(
    (e) => e.language.name === "en"
  );
  const genusEntry = species.genera.find((g) => g.language.name === "en");

  const rawChain = await pokeGet<RawEvolutionChain>(
    species.evolution_chain.url
  );

  const evolutionChain: EvolutionChain = {
    id: rawChain.id,
    root: parseEvolutionLink(rawChain.chain),
  };

  return {
    ...parseSummary(raw),
    height: raw.height,
    weight: raw.weight,
    abilities: raw.abilities.map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    })),
    flavorText: flavorEntry
      ? flavorEntry.flavor_text.replace(/\f/g, " ")
      : null,
    genus: genusEntry?.genus ?? null,
    evolutionChain,
  };
}

export async function fetchPokemonSummaries(
  names: string[]
): Promise<PokemonSummary[]> {
  return Promise.all(names.map(fetchPokemonSummary));
}
