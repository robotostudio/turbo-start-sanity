"use client";

import { useCallback, useSyncExternalStore } from "react";

interface MediaQueryListLike {
  matches: boolean;
  addEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
}

const canMatchMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

// One MediaQueryList per query, shared by subscribe and getSnapshot.
const mediaQueryCache = new Map<string, MediaQueryListLike>();

function getMediaQueryList(query: string): MediaQueryListLike | null {
  if (!canMatchMedia()) {
    return null;
  }
  let media = mediaQueryCache.get(query);
  if (!media) {
    media = window.matchMedia(query);
    mediaQueryCache.set(query, media);
  }
  return media;
}

// undefined on the server and during the first hydration render, so the tree
// matches the server output before the client-only matchMedia read kicks in.
const getServerSnapshot = () => undefined;

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = getMediaQueryList(query);
      if (!media) {
        return () => {
          // nothing to unsubscribe from on the server
        };
      }
      if (media.addEventListener) {
        media.addEventListener("change", onStoreChange);
        return () => media.removeEventListener("change", onStoreChange);
      }
      media.addListener?.(onStoreChange);
      return () => media.removeListener?.(onStoreChange);
    },
    [query]
  );

  const getSnapshot = () => getMediaQueryList(query)?.matches;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
