import { sanityFetch } from "@workspace/sanity/live";
import { queryAllBlogDataForSearch } from "@workspace/sanity/query";
import Fuse from "fuse.js";

import type { SearchableBlog } from "@/lib/search/types";

const BLOG_BY_ID_QUERY = `
  *[_type == "blog" && _id == $id && defined(slug.current) && (seoHideFromLists != true)][0]{
    _type,
    _id,
    title,
    description,
    "slug": slug.current,
    publishedAt,
    authors[0]->{
      _id,
      name
    },
    image {
      "id": asset._ref,
      "preview": asset->metadata.lqip,
      "alt": coalesce(
        alt,
        asset->altText,
        caption,
        asset->originalFilename,
        "untitled"
      ),
      hotspot {
        x,
        y
      },
      crop {
        bottom,
        left,
        right,
        top
      }
    }
  }
`;

export async function fetchAllBlogsForSearch() {
  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
    stega: false,
  });

  return (data ?? []) as SearchableBlog[];
}

export async function fetchBlogByIdForSearch(id: string) {
  const { data } = await sanityFetch({
    query: BLOG_BY_ID_QUERY,
    params: { id },
    stega: false,
  });

  return (data ?? null) as SearchableBlog | null;
}

export function fallbackFuseSearch(blogs: SearchableBlog[], query: string, limit = 10) {
  const fuse = new Fuse(blogs, {
    keys: ["title", "description", "slug", "authors.name"],
    threshold: 0.3,
    includeScore: true,
  });

  return fuse.search(query, { limit }).map((result) => result.item);
}
