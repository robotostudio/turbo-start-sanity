import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const params = new URLSearchParams(searchParams);
  const url = new URL(`/api/search?${params.toString()}`, request.url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: 502 });
    }

    const payload = (await response.json()) as {
      results?: unknown;
    };

    if (!Array.isArray(payload.results)) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(payload.results, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Search service unavailable" },
      { status: 503 }
    );
  }
}
