import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { fetchPokemonDetail, fetchPokemonList } from "@/lib/pokemon/fetcher";
import { TYPE_COLOURS, STAT_LABELS } from "@/lib/pokemon/constants";
import { TypeBadge } from "@/components/pokedex/pokemon-card";
import { EvolutionChainView } from "@/components/pokedex/evolution-chain";

export const revalidate = 3600;

type Props = { params: Promise<{ name: string }> };

export async function generateStaticParams() {
  const list = await fetchPokemonList(151, 0);
  return list.results.map((p) => ({ name: p.name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const pokemon = await fetchPokemonDetail(name).catch(() => null);
  if (!pokemon) return { title: "Pokémon not found" };
  return {
    title: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} — Pokédex`,
    description: pokemon.flavorText ?? `View stats, abilities, and evolution chain for ${pokemon.name}.`,
  };
}

export default async function PokemonDetailPage({ params }: Props) {
  const { name } = await params;
  const pokemon = await fetchPokemonDetail(name).catch(() => null);

  if (!pokemon) {
    return (
      <main className="container mx-auto px-4 py-12">
        <p className="text-muted-foreground">Pokémon &quot;{name}&quot; not found.</p>
        <Link href="/pokedex" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Pokédex
        </Link>
      </main>
    );
  }

  const sprite = pokemon.sprites.official ?? pokemon.sprites.front ?? "";
  const maxStat = Math.max(...pokemon.stats.map((s) => s.baseStat), 200);

  return (
    <main className="container mx-auto px-4 py-12 md:px-6">
      <Link
        href="/pokedex"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pokédex
      </Link>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="flex flex-col items-center rounded-2xl border bg-card p-6 shadow-sm">
            {sprite && (
              <div className="relative h-48 w-48">
                <Image
                  src={sprite}
                  alt={pokemon.name}
                  fill
                  sizes="192px"
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            )}
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              #{String(pokemon.id).padStart(3, "0")}
            </p>
            <h1 className="mt-1 text-2xl font-bold capitalize">{pokemon.name}</h1>
            {pokemon.genus && (
              <p className="text-sm text-muted-foreground">{pokemon.genus}</p>
            )}
            <div className="mt-3 flex gap-2 flex-wrap justify-center">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
          </div>

          {/* Physical */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Physical
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Height</dt>
                <dd className="font-medium">{(pokemon.height / 10).toFixed(1)} m</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="font-medium">{(pokemon.weight / 10).toFixed(1)} kg</dd>
              </div>
            </dl>
          </div>

          {/* Abilities */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Abilities
            </h2>
            <ul className="space-y-1.5">
              {pokemon.abilities.map((a) => (
                <li key={a.name} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{a.name.replace(/-/g, " ")}</span>
                  {a.isHidden && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Right column ─────────────────────────────────── */}
        <section className="space-y-6">
          {/* Flavor text */}
          {pokemon.flavorText && (
            <blockquote className="rounded-xl border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm italic text-muted-foreground">
              {pokemon.flavorText}
            </blockquote>
          )}

          {/* Base stats */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Base Stats
            </h2>
            <div className="space-y-2.5">
              {pokemon.stats.map((s) => {
                const pct = Math.min((s.baseStat / maxStat) * 100, 100);
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-9 text-right text-xs font-mono text-muted-foreground">
                      {STAT_LABELS[s.name] ?? s.name}
                    </span>
                    <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-sm tabular-nums">
                      {s.baseStat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evolution chain */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Evolution Chain
            </h2>
            <EvolutionChainView root={pokemon.evolutionChain.root} />
          </div>
        </section>
      </div>
    </main>
  );
}
