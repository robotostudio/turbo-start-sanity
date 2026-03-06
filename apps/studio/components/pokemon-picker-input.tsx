import { SearchIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Spinner, Stack, Text, TextInput } from "@sanity/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { set, type ObjectInputProps, PatchEvent, unset } from "sanity";

type PokemonResult = {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: Array<{ slot: number; name: string }>;
  stats: Array<{ name: string; abbr: string; value: number }>;
};

type PokemonValue = {
  _type?: string;
  name?: string;
  id?: number;
  spriteUrl?: string;
  types?: string[];
};

function getApiBaseUrl(): string {
  const customUrl = process.env.SANITY_STUDIO_WEB_URL;
  if (customUrl) return customUrl.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function PokemonPickerInput(props: ObjectInputProps) {
  const { onChange, value, renderDefault } = props;
  const currentValue = value as PokemonValue | undefined;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPokemon = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(
        `${baseUrl}/api/pokedex/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
      );

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPokemon(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchPokemon]);

  const handleSelect = useCallback(
    (pokemon: PokemonResult) => {
      onChange(
        PatchEvent.from([
          set({
            _type: (props.schemaType as { name: string }).name,
            name: pokemon.name,
            id: pokemon.id,
            spriteUrl: pokemon.spriteUrl,
            types: pokemon.types.map((t) => t.name),
          }),
        ]),
      );
      setQuery("");
      setShowResults(false);
      setResults([]);
    },
    [onChange, props.schemaType],
  );

  const handleClear = useCallback(() => {
    onChange(PatchEvent.from([unset()]));
  }, [onChange]);

  return (
    <Stack space={3}>
      {currentValue?.name && (
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Flex align="center" gap={3}>
            {currentValue.spriteUrl && (
              <img
                alt={currentValue.name}
                height={48}
                src={currentValue.spriteUrl}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
                width={48}
              />
            )}
            <Stack space={2} style={{ flex: 1 }}>
              <Text size={2} weight="bold" style={{ textTransform: "capitalize" }}>
                #{currentValue.id} — {currentValue.name?.replace(/-/g, " ")}
              </Text>
              {currentValue.types && (
                <Flex gap={2}>
                  {currentValue.types.map((type) => (
                    <Text key={type} muted size={1} style={{ textTransform: "capitalize" }}>
                      {type}
                    </Text>
                  ))}
                </Flex>
              )}
            </Stack>
            <Button
              fontSize={1}
              mode="ghost"
              onClick={handleClear}
              text="Remove"
              tone="critical"
            />
          </Flex>
        </Card>
      )}

      <Box>
        <TextInput
          fontSize={2}
          icon={isSearching ? Spinner : SearchIcon}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search for a Pokémon..."
          value={query}
        />
      </Box>

      {error && (
        <Card padding={3} radius={2} tone="critical">
          <Text muted size={1}>
            {error}. Make sure the web app is running at {getApiBaseUrl()}.
          </Text>
        </Card>
      )}

      {showResults && results.length > 0 && (
        <Card radius={2} shadow={1}>
          <Stack>
            {results.map((pokemon) => (
              <Card
                as="button"
                key={pokemon.id}
                onClick={() => handleSelect(pokemon)}
                padding={3}
                style={{
                  cursor: "pointer",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Flex align="center" gap={3}>
                  {pokemon.spriteUrl && (
                    <img
                      alt={pokemon.name}
                      height={40}
                      src={pokemon.spriteUrl}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "contain",
                      }}
                      width={40}
                    />
                  )}
                  <Stack space={1} style={{ flex: 1 }}>
                    <Text size={2} weight="medium" style={{ textTransform: "capitalize" }}>
                      #{String(pokemon.id).padStart(3, "0")} {pokemon.name.replace(/-/g, " ")}
                    </Text>
                    <Flex gap={2}>
                      {pokemon.types.map((t) => (
                        <Text key={t.name} muted size={1} style={{ textTransform: "capitalize" }}>
                          {t.name}
                        </Text>
                      ))}
                    </Flex>
                  </Stack>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {showResults && results.length === 0 && !isSearching && query.length >= 2 && (
        <Card padding={3} radius={2} tone="caution">
          <Text muted size={1}>
            No Pokémon found matching &quot;{query}&quot;
          </Text>
        </Card>
      )}

      <div style={{ display: "none" }}>{renderDefault(props)}</div>
    </Stack>
  );
}
