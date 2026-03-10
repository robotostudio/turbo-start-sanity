export type SearchableBlog = {
  _id: string;
  _type: "blog";
  title: string | null;
  description: string | null;
  slug: string | null;
  publishedAt: string | null;
  authors: {
    _id: string;
    name: string | null;
  } | null;
  image?: {
    id?: string | null;
    alt?: string | null;
    preview?: string | null;
    hotspot?: {
      x?: number | null;
      y?: number | null;
    } | null;
    crop?: {
      bottom?: number | null;
      left?: number | null;
      right?: number | null;
      top?: number | null;
    } | null;
  } | null;
};

export type BlogSearchFilters = {
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export type SearchResponse = {
  results: SearchableBlog[];
  total: number;
  source: "opensearch" | "fallback";
};
