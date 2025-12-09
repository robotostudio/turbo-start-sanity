import Fuse from "fuse.js";
import { NextResponse } from "next/server";

import { sanityFetch } from "@/lib/sanity/live";
import { queryAllBlogDataForSearch } from "@/lib/sanity/query";

export const revalidate = 360; // every 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const { data } = await sanityFetch({
    query: queryAllBlogDataForSearch,
    stega: false,
  });

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
