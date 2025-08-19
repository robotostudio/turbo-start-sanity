// apps/web/src/components/PokemonDisplay.tsx
"use client";

import React from "react";
import Image from "next/image";
import type { SanityPokemon, PokemonReference } from "@/types/pokemon";
import { cleanPokemonData, isValidPokemon } from "@/utils";

interface PokemonDisplayProps {
  pokemon?: SanityPokemon | null;
  pokemonRef?: PokemonReference | null;
  loading?: boolean;
}

// Type colors with proper contrast
const POKEMON_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: "bg-[#A8A878]", text: "text-white" },
  fire: { bg: "bg-[#F08030]", text: "text-white" },
  water: { bg: "bg-[#6890F0]", text: "text-white" },
  electric: { bg: "bg-[#F8D030]", text: "text-gray-900" },
  grass: { bg: "bg-[#78C850]", text: "text-white" },
  ice: { bg: "bg-[#98D8D8]", text: "text-gray-900" },
  fighting: { bg: "bg-[#C03028]", text: "text-white" },
  poison: { bg: "bg-[#A040A0]", text: "text-white" },
  ground: { bg: "bg-[#E0C068]", text: "text-gray-900" },
  flying: { bg: "bg-[#A890F0]", text: "text-white" },
  psychic: { bg: "bg-[#F85888]", text: "text-white" },
  bug: { bg: "bg-[#A8B820]", text: "text-white" },
  rock: { bg: "bg-[#B8A038]", text: "text-white" },
  ghost: { bg: "bg-[#705898]", text: "text-white" },
  dragon: { bg: "bg-[#7038F8]", text: "text-white" },
  dark: { bg: "bg-[#705848]", text: "text-white" },
  steel: { bg: "bg-[#B8B8D0]", text: "text-gray-900" },
  fairy: { bg: "bg-[#EE99AC]", text: "text-gray-900" },
};

export function PokemonDisplay({
  pokemon,
  pokemonRef,
  loading,
}: PokemonDisplayProps) {
  // Handle loading state
  if (loading) return <PokemonSkeleton />;

  try {
    // Resolve raw data
    let rawPokemonData: SanityPokemon | null = null;

    if (pokemon) {
      rawPokemonData = pokemon;
    } else if (pokemonRef?.pokemon) {
      rawPokemonData = pokemonRef.pokemon;
    } else if (pokemonRef?.name || pokemonRef?.id) {
      rawPokemonData = pokemonRef as any;
    }

    // Clean and validate the pokemon data
    const cleanedPokemonData = cleanPokemonData(rawPokemonData);

    if (!isValidPokemon(cleanedPokemonData)) {
      console.log("Invalid or missing Pokemon data:", {
        rawPokemonData,
        cleanedPokemonData,
      });
      return null;
    }

    return <PokemonContent pokemonData={cleanedPokemonData!} />;
  } catch (error) {
    console.error("Pokemon Display Error:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p className="text-red-800 font-medium">Unable to load Pokemon data</p>
        <p className="text-red-600 text-sm mt-1">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }
}

// Separate the actual rendering logic
function PokemonContent({ pokemonData }: { pokemonData: SanityPokemon }) {
  // Get sprite URL with fallback to PokeAPI
  const spriteUrl = pokemonData.sprite
    ? pokemonData.sprite
    : pokemonData.id
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonData.id}.png`
      : "/pokemon-default.png";

  return (
    <div className="pokemon-card bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 my-8 border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        Featured Pokémon
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Sprite Container */}
        <div className="relative">
          <div className="bg-white rounded-full p-4 shadow-lg">
            {/* Use regular img tag for external Pokemon sprites to avoid Next.js Image restrictions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spriteUrl}
              alt={pokemonData.name || "Pokemon"}
              width={96}
              height={96}
              className="image-pixelated"
              style={{
                imageRendering: "pixelated",
                width: "96px",
                height: "96px",
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/pokemon-default.png";
              }}
            />
          </div>
        </div>

        {/* Pokemon Info */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-2xl font-bold capitalize text-gray-900 mb-2">
            {pokemonData.name}
          </h4>
          {pokemonData.id && (
            <p className="text-lg text-gray-600 mb-3">
              #{pokemonData.id.toString().padStart(3, "0")}
            </p>
          )}

          {pokemonData.types && pokemonData.types.length > 0 && (
            <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
              {pokemonData.types.map((type, index) => {
                const typeColors = POKEMON_TYPE_COLORS[type] || {
                  bg: "bg-[#68A090]",
                  text: "text-white",
                };
                return (
                  <span
                    key={`${type}-${index}`}
                    className={`px-3 py-1 text-sm font-medium rounded-full capitalize shadow-sm ${typeColors.bg} ${typeColors.text}`}
                  >
                    {type}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function PokemonSkeleton() {
  return (
    <div className="rounded-xl p-6 my-8 border border-gray-200 animate-pulse">
      <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client-side Error Boundary Component
export class PokemonErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Pokemon component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-red-800 font-medium">
              Unable to load Pokemon data
            </p>
            <p className="text-red-600 text-sm mt-1">
              There was an error displaying the Pokemon information.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
