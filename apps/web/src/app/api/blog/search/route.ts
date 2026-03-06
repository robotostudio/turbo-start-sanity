import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const author = searchParams.get("author");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const baseUrl = new URL(request.url).origin;
  const searchUrl = new URL("/api/search", baseUrl);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("limit", "10");
  if (category) searchUrl.searchParams.set("category", category);
  if (author) searchUrl.searchParams.set("author", author);
  if (dateFrom) searchUrl.searchParams.set("dateFrom", dateFrom);
  if (dateTo) searchUrl.searchParams.set("dateTo", dateTo);

  try {
    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error ?? "Search failed" },
        { status: response.status },
      );
    }

    const blogs = (data.hits ?? []).map(
      (hit: Record<string, unknown>) => ({
        _type: hit._type,
        _id: hit._id,
        title: hit.title,
        description: hit.description,
        slug: hit.slug,
        orderRank: hit.orderRank,
        image: hit.image,
        publishedAt: hit.publishedAt,
        authors: hit.authors,
      }),
    );

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("[blog/search] Failed to proxy to /api/search:", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 503 },
    );
  }
}
