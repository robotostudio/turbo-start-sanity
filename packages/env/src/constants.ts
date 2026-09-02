// Sanity recommends pinning the client to today's UTC date unless you need a
// specific older API behavior. Computed at runtime so the fallback is always
// the latest version instead of a hardcoded date that goes stale.
export const DEFAULT_SANITY_API_VERSION = new Date().toISOString().slice(0, 10);
