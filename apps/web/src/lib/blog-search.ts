import { type DynamicFetchOptions, sanityFetch } from "@workspace/sanity/live";
import { queryAllBlogDataForSearch } from "@workspace/sanity/query";
import Fuse from "fuse.js";

async function fetchSearchableBlogs(
  perspective: DynamicFetchOptions["perspective"]
) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
    perspective,
    stega: false,
  });
  return data;
}

export async function searchBlogs(
  query: string,
  category: string,
  perspective: DynamicFetchOptions["perspective"]
) {
  const blogs = await fetchSearchableBlogs(perspective);
  const blogsInCategory = category
    ? blogs.filter((blog) => blog.category === category)
    : blogs;
  const fuse = new Fuse(blogsInCategory, {
    keys: ["title", "description", "slug", "authors.name"],
    threshold: 0.3,
  });
  return fuse.search(query, { limit: 10 }).map((result) => result.item);
}
