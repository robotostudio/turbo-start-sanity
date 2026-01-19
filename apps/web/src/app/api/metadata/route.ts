import { type NextRequest, NextResponse } from "next/server";

import { getMetadata } from "@/lib/metadata";
import { generateFallbackMetadata } from "@/lib/metadata/parser";
import type { MetadataResult } from "@/lib/metadata/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function errorResponse(
  message: string,
  status: number,
  url = ""
): NextResponse<MetadataResult> {
  return NextResponse.json(
    { success: false, error: message, data: generateFallbackMetadata(url) },
    { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get("url");

  if (!url) {
    return errorResponse("Missing 'url' query parameter", 400);
  }

  const result = await getMetadata(url);

  const cacheHeader = result.success
    ? "public, s-maxage=3600, stale-while-revalidate=86400"
    : "no-store";

  return NextResponse.json(result, {
    status: result.success ? 200 : 206,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": cacheHeader,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return errorResponse("Missing or invalid 'url' in request body", 400);
    }

    const result = await getMetadata(url);

    return NextResponse.json(result, {
      status: result.success ? 200 : 206,
      headers: CORS_HEADERS,
    });
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
}
