import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EvolutionChain } from "@/components/pokedex/evolution-chain";
import { PokemonComparison } from "@/components/pokedex/pokemon-comparison";
import { StatBar } from "@/components/pokedex/stat-bar";
import { TypeBadge } from "@/components/pokedex/type-badge";
import { getPokemonDetail } from "@/lib/pokeapi";
import { capitalize } from "@/utils";

export const revalidate = 86_400;

type PokemonPageProps = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata({
  params,
}: PokemonPageProps): Promise<Metadata> {
  const { name } = await params;
  const pokemonName = capitalize(name.replace(/-/g, " "));

  return {
    title: `${pokemonName} — Pokédex`,
    description: `View ${pokemonName}'s stats, abilities, evolution chain, and more in the Pokédex.`,
  };
}

export default async function PokemonDetailPage({ params }: PokemonPageProps) {
  const { name } = await params;

  let pokemon;
  try {
    pokemon = await getPokemonDetail(name);
  } catch {
    notFound();
  }

  const displayName = capitalize(pokemon.name.replace(/-/g, " "));
  const totalStats = pokemon.stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <main className="container mx-auto px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link className="transition-colors hover:text-foreground" href="/pokedex">
          ← Back to Pokédex
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="relative flex flex-col items-center rounded-2xl bg-muted/50 p-8">
            <span className="absolute top-4 right-4 font-bold text-2xl text-muted-foreground/30">
              #{String(pokemon.id).padStart(3, "0")}
            </span>

            {(pokemon.species.isLegendary || pokemon.species.isMythical) && (
              <span className="absolute top-4 left-4 rounded-full bg-yellow-400 px-3 py-1 font-semibold text-black text-xs">
                {pokemon.species.isMythical ? "Mythical" : "Legendary"}
              </span>
            )}

            {pokemon.artworkUrl ? (
              <img
                alt={displayName}
                className="h-64 w-64 object-contain drop-shadow-lg"
                height={256}
                src={pokemon.artworkUrl}
                width={256}
              />
            ) : pokemon.spriteUrl ? (
              <img
                alt={displayName}
                className="h-48 w-48 object-contain [image-rendering:pixelated]"
                height={192}
                src={pokemon.spriteUrl}
                width={192}
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-muted text-muted-foreground">
                ?
              </div>
            )}

            <h1 className="mt-4 font-bold text-3xl capitalize">{displayName}</h1>

            {pokemon.species.genus && (
              <p className="text-muted-foreground">{pokemon.species.genus}</p>
            )}

            <div className="mt-3 flex gap-2">
              {pokemon.types.map((type) => (
                <TypeBadge key={type.name} type={type.name} size="lg" />
              ))}
            </div>
          </div>

          {pokemon.species.flavorText && (
            <div className="rounded-xl border p-4">
              <p className="text-sm italic text-muted-foreground">
                &ldquo;{pokemon.species.flavorText}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoCard label="Height" value={`${pokemon.height / 10} m`} />
            <InfoCard label="Weight" value={`${pokemon.weight / 10} kg`} />
            <InfoCard label="Generation" value={pokemon.species.generation.replace("generation-", "Gen ").toUpperCase()} />
            <InfoCard label="Capture Rate" value={String(pokemon.species.captureRate)} />
            <InfoCard label="Base Happiness" value={String(pokemon.species.baseHappiness)} />
            <InfoCard label="Growth Rate" value={capitalize(pokemon.species.growthRate.replace(/-/g, " "))} />
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="mb-4 font-semibold text-xl">Base Stats</h2>
            <div className="space-y-3 rounded-xl border p-4">
              {pokemon.stats.map((stat) => (
                <StatBar key={stat.name} stat={stat} />
              ))}
              <div className="mt-2 border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Total</span>
                  <span className="font-bold text-sm">{totalStats}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-semibold text-xl">Abilities</h2>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((ability) => (
                <span
                  key={ability.name}
                  className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                    ability.isHidden
                      ? "border-dashed border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      : "bg-muted"
                  }`}
                >
                  {ability.name.replace(/-/g, " ")}
                  {ability.isHidden && (
                    <span className="ml-1 text-[10px] uppercase opacity-60">
                      Hidden
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>

          <PokemonComparison currentPokemon={pokemon} />
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-6 font-semibold text-xl">Evolution Chain</h2>
        <EvolutionChain chain={pokemon.evolutionChain} currentName={pokemon.name} />
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-semibold text-sm">{value}</p>
    </div>
  );
}
