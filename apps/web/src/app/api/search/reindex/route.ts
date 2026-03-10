import { NextResponse } from "next/server";

import { bulkReplaceBlogs } from "@/lib/search/opensearch";
import { fetchAllBlogsForSearch } from "@/lib/search/sanity";

function isAuthorized(request: Request) {
  const secret = process.env.SEARCH_REINDEX_SECRET;

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  return authHeader.slice(7) === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const blogs = await fetchAllBlogsForSearch();
    await bulkReplaceBlogs(blogs);

    return NextResponse.json({
      ok: true,
      indexedCount: blogs.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Reindex failed",
      },
      { status: 500 }
    );
  }
}
