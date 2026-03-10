"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { EvolutionLink } from "@/lib/pokemon/types";

// We need sprites but the evolution chain only gives us names.
// Use the deterministic sprite URL pattern (works for all ~1000 Pokémon).
function spriteUrl(name: string) {
  return `https://img.pokemondb.net/sprites/sword-shield/icon/${name}.png`;
}

type NodeProps = {
  link: EvolutionLink;
  /** depth used for subtle indent on branch splits */
  depth?: number;
};

function EvoNode({ link }: NodeProps) {
  return (
    <Link
      href={`/pokedex/${link.name}`}
      className="flex flex-col items-center gap-1 rounded-xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md min-w-[80px]"
    >
      <div className="relative h-12 w-12">
        <Image
          src={spriteUrl(link.name)}
          alt={link.name}
          fill
          sizes="48px"
          className="object-contain"
        />
      </div>
      <span className="text-xs font-semibold capitalize text-center leading-tight">{link.name}</span>
    </Link>
  );
}

function EvoArrow({ trigger, minLevel }: { trigger: string | null; minLevel: number | null }) {
  const label = minLevel
    ? `Lv. ${minLevel}`
    : trigger
    ? trigger.replace(/-/g, " ")
    : null;

  return (
    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
      <ArrowRight className="h-5 w-5" />
      {label && (
        <span className="text-[10px] capitalize whitespace-nowrap max-w-[64px] text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Renders a single Pokémon and all its evolutions recursively.
 * Handles linear chains and branching (Eevee, Slowpoke, etc.).
 */
function EvoTree({ link }: { link: EvolutionLink }) {
  const hasBranch = link.evolvesTo.length > 1;

  return (
    <div className="flex items-start gap-3">
      <EvoNode link={link} />

      {link.evolvesTo.length > 0 && (
        <div className={`flex ${hasBranch ? "flex-col gap-2" : "items-start"} gap-3`}>
          {link.evolvesTo.map((evo) => (
            <div key={evo.name} className="flex items-center gap-3">
              <EvoArrow trigger={evo.trigger} minLevel={evo.minLevel} />
              <EvoTree link={evo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type EvolutionChainProps = {
  root: EvolutionLink;
};

export function EvolutionChainView({ root }: EvolutionChainProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-muted/30 p-4">
      <EvoTree link={root} />
    </div>
  );
}
