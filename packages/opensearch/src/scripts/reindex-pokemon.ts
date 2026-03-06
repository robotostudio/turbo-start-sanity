import {
  bulkIndexPokemonDocuments,
  ensurePokemonIndex,
  getPokemonIndexStats,
  type PokemonDocument,
} from "../index";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const POKEMON_COUNT = Number.parseInt(
  process.env.POKEMON_COUNT ?? "151",
  10,
);
const CONCURRENCY = 10;

type PokeAPIPokemon = {
  id: number;
  name: string;
  sprites: {
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
    front_default: string | null;
  };
  types: Array<{ type: { name: string } }>;
  stats: Array<{
    base_stat: number;
    stat: { name: string };
  }>;
};

type PokeAPISpecies = {
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
  generation: { name: string };
  is_legendary: boolean;
  is_mythical: boolean;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchPokemonDoc(id: number): Promise<PokemonDocument> {
  const [pokemon, species] = await Promise.all([
    fetchJson<PokeAPIPokemon>(`${POKEAPI_BASE}/pokemon/${id}`),
    fetchJson<PokeAPISpecies>(`${POKEAPI_BASE}/pokemon-species/${id}`),
  ]);

  const statMap: Record<string, number> = {};
  let totalStats = 0;
  for (const s of pokemon.stats) {
    statMap[s.stat.name] = s.base_stat;
    totalStats += s.base_stat;
  }

  const enFlavorText = species.flavor_text_entries.find(
    (e) => e.language.name === "en",
  );

  const enGenus = species.genera.find((g) => g.language.name === "en");

  return {
    pokemonId: pokemon.id,
    name: pokemon.name,
    types: pokemon.types.map((t) => t.type.name),
    genus: enGenus?.genus ?? null,
    flavorText: enFlavorText
      ? enFlavorText.flavor_text
          .replace(/\f/g, " ")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : null,
    generation: species.generation.name,
    spriteUrl:
      pokemon.sprites.other?.["official-artwork"]?.front_default ??
      pokemon.sprites.front_default,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    hp: statMap.hp ?? 0,
    attack: statMap.attack ?? 0,
    defense: statMap.defense ?? 0,
    specialAttack: statMap["special-attack"] ?? 0,
    specialDefense: statMap["special-defense"] ?? 0,
    speed: statMap.speed ?? 0,
    totalStats,
  };
}

async function main() {
  console.log(`Starting Pokemon reindex (${POKEMON_COUNT} Pokemon)...`);
  console.log(
    `OpenSearch URL: ${process.env.OPENSEARCH_URL ?? "http://localhost:9200"}`,
  );
  console.log("");

  console.log("Ensuring Pokemon index with correct mappings...");
  await ensurePokemonIndex({ forceRecreate: true });
  console.log("Pokemon index created/recreated");

  console.log(`Fetching ${POKEMON_COUNT} Pokemon from PokeAPI...`);
  const docs: PokemonDocument[] = [];

  for (let i = 1; i <= POKEMON_COUNT; i += CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(CONCURRENCY, POKEMON_COUNT - i + 1) },
      (_, j) => i + j,
    );

    const results = await Promise.allSettled(
      batch.map((id) => fetchPokemonDoc(id)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        docs.push(result.value);
      } else {
        console.warn(`Failed to fetch pokemon: ${result.reason}`);
      }
    }

    if (i % 50 === 1 || i + CONCURRENCY > POKEMON_COUNT) {
      console.log(`  Fetched ${docs.length}/${POKEMON_COUNT}...`);
    }
  }

  console.log(`Fetched ${docs.length} Pokemon documents`);

  if (docs.length === 0) {
    console.log("No Pokemon fetched. Index will be empty.");
    return;
  }

  console.log("Indexing Pokemon into OpenSearch...");
  const { indexed, errors } = await bulkIndexPokemonDocuments(docs);
  console.log(`Indexed: ${indexed}, Errors: ${errors}`);

  const stats = await getPokemonIndexStats();
  console.log("");
  console.log("Pokemon index stats:");
  console.log(`Documents: ${stats.documentCount}`);
  console.log(`Index exists: ${stats.indexExists}`);
  console.log("");
  console.log("Pokemon reindex complete!");
}

main().catch((err) => {
  console.error("Pokemon reindex failed:", err);
  process.exit(1);
});
