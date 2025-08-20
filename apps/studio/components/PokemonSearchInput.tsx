import React, { useState, useCallback } from "react";
import { set, unset, ObjectInputProps, ObjectSchemaType } from "sanity";
import {
  Card,
  Text,
  TextInput,
  Button,
  Flex,
  Stack,
  Spinner,
  Box,
  Badge,
} from "@sanity/ui";
import { PokemonResult } from "../types/pokemon"; // ✅ reuse type

// Raw PokeAPI response type (partial)
interface ApiPokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: Array<{
    type: { name: string };
  }>;
}

// Helpers
function cleanPokemonName(name: string): string {
  return name
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "")
    .replace(/[^\w\s\-']/g, "")
    .trim()
    .toLowerCase();
}
function cleanPokemonType(type: string): string {
  return type
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "")
    .replace(/[^\w]/g, "")
    .trim()
    .toLowerCase();
}

export function PokemonSearchInput(
  props: ObjectInputProps<Record<string, any>, ObjectSchemaType>,
) {
  const { onChange, value } = props;

  // Cast to your clean type
  const pokemonValue = value as PokemonResult | undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ApiPokemon[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPokemon = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const cleanTerm = term.toLowerCase().trim();
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${cleanTerm}`,
      );
      if (response.ok) {
        const pokemon = await response.json();
        setSearchResults([pokemon]);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Pokemon search error:", err);
      setSearchResults([]);
    }
    setLoading(false);
  }, []);

  const selectPokemon = useCallback(
    (pokemon: ApiPokemon) => {
      const cleaned: PokemonResult = {
        _type: "pokemon",
        id: pokemon.id,
        name: cleanPokemonName(pokemon.name),
        sprite: pokemon.sprites.front_default,
        types: pokemon.types.map((t) => cleanPokemonType(t.type.name)),
      };
      onChange(set(cleaned));
      setSearchTerm("");
      setSearchResults([]);
    },
    [onChange],
  );

  const clearSelection = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  return (
    <Stack space={3}>
      {/* Current Selection */}
      {pokemonValue && (
        <Card padding={3} tone="primary" border>
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={3}>
              {pokemonValue.sprite && (
                <Box>
                  <img
                    src={pokemonValue.sprite}
                    alt={pokemonValue.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      imageRendering: "pixelated",
                    }}
                  />
                </Box>
              )}
              <Stack space={2}>
                <Text weight="medium" style={{ textTransform: "capitalize" }}>
                  {pokemonValue.name}
                </Text>
                <Text size={1} muted>
                  #{pokemonValue.id?.toString().padStart(3, "0")}
                </Text>
                <Flex gap={1} wrap="wrap">
                  {pokemonValue.types?.map((type, idx) => (
                    <Badge
                      key={idx}
                      tone="default"
                      style={{ textTransform: "capitalize" }}
                    >
                      {type}
                    </Badge>
                  ))}
                </Flex>
              </Stack>
            </Flex>
            <Button
              onClick={clearSelection}
              tone="critical"
              mode="ghost"
              text="Remove"
            />
          </Flex>
        </Card>
      )}

      {/* Search Input */}
      <TextInput
        placeholder="Search for a Pokémon by name or ID..."
        value={searchTerm}
        onChange={(event) => {
          const newValue = event.currentTarget.value;
          setSearchTerm(newValue);
          searchPokemon(newValue);
        }}
      />

      {/* Loading */}
      {loading && (
        <Flex align="center" gap={2}>
          <Spinner size={1} />
          <Text size={1} muted>
            Searching...
          </Text>
        </Flex>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card border style={{ maxHeight: "240px", overflowY: "auto" }}>
          {searchResults.map((pokemon) => (
            <Card
              key={pokemon.id}
              padding={3}
              tone="transparent"
              style={{
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onClick={() => selectPokemon(pokemon)}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              <Flex align="center" gap={3}>
                <Box>
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      imageRendering: "pixelated",
                    }}
                  />
                </Box>
                <Stack space={2}>
                  <Text weight="medium" style={{ textTransform: "capitalize" }}>
                    {cleanPokemonName(pokemon.name)}
                  </Text>
                  <Text size={1} muted>
                    #{pokemon.id.toString().padStart(3, "0")}
                  </Text>
                  <Flex gap={1} wrap="wrap">
                    {pokemon.types.map((type, idx) => (
                      <Badge
                        key={idx}
                        tone="default"
                        style={{ textTransform: "capitalize" }}
                      >
                        {cleanPokemonType(type.type.name)}
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
              </Flex>
            </Card>
          ))}
        </Card>
      )}

      {/* No Results */}
      {!loading && searchTerm && searchResults.length === 0 && (
        <Text size={1} muted>
          No Pokémon found for "{searchTerm}"
        </Text>
      )}
    </Stack>
  );
}
