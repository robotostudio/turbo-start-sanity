/**
 * PokemonPickerInput — a custom Sanity Studio input that lets editors
 * search for and select a Pokémon using live PokeAPI autocomplete.
 *
 * Usage in a schema field:
 *   defineField({
 *     name: "featuredPokemon",
 *     type: "string",
 *     components: { input: PokemonPickerInput },
 *   })
 *
 * The field stores the Pokémon name (lowercase slug), which maps directly
 * to the /pokedex/[name] route.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { set, unset } from "sanity";
import type { StringInputProps } from "sanity";

type PokeResult = { name: string; url: string };

function pokemonId(url: string): number {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function officialArt(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function PokemonPickerInput(props: StringInputProps) {
  const { value, onChange } = props;

  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<PokeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search PokeAPI — uses the list endpoint filtered client-side
  // (PokeAPI doesn't have a search endpoint; fetching all names once is fine
  //  since the response is ~100 KB and very cache-friendly)
  const allNamesRef = useRef<PokeResult[] | null>(null);

  const loadAllNames = useCallback(async () => {
    if (allNamesRef.current) return allNamesRef.current;
    const res = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0"
    );
    const data = (await res.json()) as { results: PokeResult[] };
    allNamesRef.current = data.results;
    return data.results;
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const all = await loadAllNames();
        const lower = q.toLowerCase();
        setResults(
          all.filter((p) => p.name.startsWith(lower)).slice(0, 8)
        );
      } finally {
        setLoading(false);
      }
    },
    [loadAllNames]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const select = (name: string) => {
    onChange(set(name));
    setQuery(name);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    onChange(unset());
    setQuery("");
    setResults([]);
  };

  return (
    <div style={{ position: "relative", maxWidth: 400 }}>
      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "1px solid var(--card-border-color, #ccc)",
            borderRadius: 4,
            background: "var(--card-bg-color, #fff)",
            color: "var(--card-fg-color, inherit)",
            fontSize: 14,
          }}
          placeholder="Search Pokémon…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            title="Clear selection"
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--card-border-color, #ccc)",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected preview */}
      {value && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--card-border-color, #ccc)",
            background: "var(--card-muted-bg-color, #f5f5f5)",
          }}
        >
          {/* We derive the ID from the cached list if possible */}
          <img
            src={`https://img.pokemondb.net/sprites/sword-shield/icon/${value}.png`}
            alt={value}
            width={40}
            height={40}
            style={{ imageRendering: "pixelated" }}
          />
          <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
          <a
            href={`/pokedex/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}
          >
            View ↗
          </a>
        </div>
      )}

      {/* Dropdown */}
      {open && (results.length > 0 || loading) && (
        <ul
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "var(--card-bg-color, #fff)",
            border: "1px solid var(--card-border-color, #ccc)",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {loading && (
            <li style={{ padding: "8px 12px", opacity: 0.5, fontSize: 13 }}>
              Searching…
            </li>
          )}
          {results.map((r) => {
            const id = pokemonId(r.url);
            return (
              <li
                key={r.name}
                onMouseDown={() => select(r.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                }}
                // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--card-muted-bg-color, #f0f0f0)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <img
                  src={officialArt(id)}
                  alt={r.name}
                  width={32}
                  height={32}
                  style={{ imageRendering: "pixelated" }}
                />
                <span style={{ textTransform: "capitalize" }}>
                  <strong>#{String(id).padStart(3, "0")}</strong> {r.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
