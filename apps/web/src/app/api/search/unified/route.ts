import {
  searchUnifiedGraceful,
  unifiedSearchParamsSchema,
} from "@workspace/opensearch";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

/**
 * GET /api/search/unified?q=fire&page=1&limit=10
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parseResult = unifiedSearchParamsSchema.safeParse(rawParams);
  if (!parseResult.success) {
    const errors = z.prettifyError(parseResult.error);
    return NextResponse.json(
      { error: "Invalid search parameters", details: errors },
      { status: 400 },
    );
  }

  const params = parseResult.data;

  try {
    const results = await searchUnifiedGraceful(params);

    if (results) {
      return NextResponse.json({
        ...results,
        source: "opensearch",
      });
    }
  } catch (error) {
    console.error("[search/unified] OpenSearch failed:", error);
  }

  return NextResponse.json(
    {
      hits: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      source: "unavailable",
    },
  );
}
