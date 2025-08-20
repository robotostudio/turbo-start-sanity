// components/PokemonSearchInput.tsx - Using Sanity UI components

import React, { useState, useCallback } from "react";
import { StringInputProps, set, unset } from "sanity";
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

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
}

// Clean Pokemon name function
function cleanPokemonName(name: string): string {
  return name
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "") // Remove invisible characters
    .replace(/[^\w\s\-']/g, "") // Keep only safe characters
    .trim()
    .toLowerCase();
}

// Clean Pokemon type function
function cleanPokemonType(type: string): string {
  return type
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, "")
    .replace(/[^\w]/g, "")
    .trim()
    .toLowerCase();
}

export const PokemonSearchInput: React.FC<StringInputProps> = (props) => {
  const { onChange, value } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
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
        // If direct search fails, try to search by ID if it's a number
        if (/^\d+$/.test(cleanTerm)) {
          const idResponse = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${cleanTerm}`,
          );
          if (idResponse.ok) {
            const pokemon = await idResponse.json();
            setSearchResults([pokemon]);
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Pokemon search error:", error);
      setSearchResults([]);
    }
    setLoading(false);
  }, []);

  const selectPokemon = useCallback(
    (pokemon: Pokemon) => {
      // Clean the data before saving to Sanity
      const cleanedPokemonData = {
        _type: "pokemon",
        id: pokemon.id,
        name: cleanPokemonName(pokemon.name), // Clean the name
        sprite: pokemon.sprites.front_default,
        types: pokemon.types
          .map((t) => cleanPokemonType(t.type.name)) // Clean each type
          .filter((type) => type.length > 0), // Remove empty types
      };

      console.log("Saving cleaned Pokemon data:", cleanedPokemonData);

      onChange(set(cleanedPokemonData));
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
      {/* Current Selection Display */}
      {value && (
        <Card padding={3} tone="primary" border>
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={3}>
              {value.sprite && (
                <Box>
                  <img
                    src={value.sprite}
                    alt={value.name}
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
                  {value.name}
                </Text>
                <Text size={1} muted>
                  #{value.id?.toString().padStart(3, "0")}
                </Text>
                {value.types && (
                  <Flex gap={1} wrap="wrap">
                    {value.types.map((type: string, index: number) => (
                      <Badge
                        key={index}
                        tone="default"
                        style={{ textTransform: "capitalize" }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </Flex>
                )}
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

      {/* Loading State */}
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
              style={{ cursor: "pointer" }}
              onClick={() => selectPokemon(pokemon)}
              __unstable_hover={{ tone: "default" }}
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
                    {pokemon.types.map((type, index) => (
                      <Badge
                        key={index}
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
};
