export const MAX_SEARCH_LENGTH = 100;

export function parseBlogSearchParam(q: string | string[] | undefined): string {
  const firstQuery = Array.isArray(q) ? q[0] : q;
  return firstQuery?.trim().slice(0, MAX_SEARCH_LENGTH) ?? "";
}
