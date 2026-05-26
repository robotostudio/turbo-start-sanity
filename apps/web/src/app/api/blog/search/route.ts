import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@workspace/sanity/live";
import { queryAllBlogDataForSearch } from "@workspace/sanity/query";
import Fuse from "fuse.js";
import { NextResponse } from "next/server";

async function getSearchableBlogs(
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const { perspective } = await getDynamicFetchOptions();
  const data = await getSearchableBlogs(perspective);

  if (!data) {
    return NextResponse.json({ error: "No data found" }, { status: 404 });
  }

  const fuse = new Fuse(data, {
    keys: ["title", "description", "slug", "authors.name"],
    threshold: 0.3,
  });

  const results = fuse.search(query, {
    limit: 10,
  });
  return NextResponse.json(results.map((result) => result.item));
}
