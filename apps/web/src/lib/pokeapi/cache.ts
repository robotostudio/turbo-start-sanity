const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ENTRIES = 2_000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const inflight = new Map<string, Promise<unknown>>();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}

function evictOldest() {
  if (cache.size <= MAX_ENTRIES) return;
  const keysToDelete = cache.size - MAX_ENTRIES;
  let deleted = 0;
  for (const key of cache.keys()) {
    if (deleted >= keysToDelete) break;
    cache.delete(key);
    deleted++;
  }
}

export async function cachedFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const existing = inflight.get(url) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = fetchFromOrigin<T>(url);
  inflight.set(url, promise);

  try {
    const data = await promise;

    cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    evictExpired();
    evictOldest();

    return data;
  } finally {
    inflight.delete(url);
  }
}

async function fetchFromOrigin<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    // Also use Next.js fetch cache as a second layer
    next: { revalidate: 86_400 },
  });

  if (!res.ok) {
    throw new Error(`PokeAPI request failed: ${res.status} ${url}`);
  }

  return res.json() as Promise<T>;
}

export async function warmCache(
  urls: string[],
  concurrency = 10,
): Promise<void> {
  const uncached = urls.filter((url) => {
    const entry = cache.get(url);
    return !entry || entry.expiresAt < Date.now();
  });

  for (let i = 0; i < uncached.length; i += concurrency) {
    const batch = uncached.slice(i, i + concurrency);
    await Promise.allSettled(batch.map((url) => cachedFetch(url)));
  }
}

export function getCacheStats() {
  evictExpired();
  return {
    size: cache.size,
    maxEntries: MAX_ENTRIES,
    ttlMs: CACHE_TTL_MS,
  };
}
