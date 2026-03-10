"use client";

import { Badge } from "@workspace/ui/components/badge";
import Link from "next/link";
import Image from "next/image";

import { TYPE_COLOURS, STAT_LABELS } from "@/lib/pokemon/constants";
import type { PokemonSummary } from "@/lib/pokemon/types";

function TypeBadge({ type }: { type: string }) {
  const colour = TYPE_COLOURS[type as keyof typeof TYPE_COLOURS] ?? "bg-gray-400 text-white";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold capitalize ${colour}`}>
      {type}
    </span>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  // Base stats cap at 255 (Blissey HP), use 200 as a comfortable visual max
  const pct = Math.min((value / 200) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">{label}</span>
      <div className="flex-1 rounded-full bg-muted h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[11px] tabular-nums">{value}</span>
    </div>
  );
}

type PokemonCardProps = {
  pokemon: PokemonSummary;
};

export function PokemonCard({ pokemon }: PokemonCardProps) {
  const sprite = pokemon.sprites.official ?? pokemon.sprites.front ?? "";

  return (
    <Link
      href={`/pokedex/${pokemon.name}`}
      className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative mx-auto h-28 w-28">
        {sprite ? (
          <Image
            src={sprite}
            alt={pokemon.name}
            fill
            sizes="112px"
            className="object-contain drop-shadow-md transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-4xl">
            ?
          </div>
        )}
      </div>

      <div className="space-y-1 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          #{String(pokemon.id).padStart(3, "0")}
        </p>
        <h3 className="font-semibold capitalize">{pokemon.name}</h3>
        <div className="flex justify-center gap-1 flex-wrap">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </div>

      <div className="space-y-1 pt-1">
        {pokemon.stats.map((s) => (
          <StatBar
            key={s.name}
            label={STAT_LABELS[s.name] ?? s.name}
            value={s.baseStat}
          />
        ))}
      </div>
    </Link>
  );
}

export { TypeBadge };
