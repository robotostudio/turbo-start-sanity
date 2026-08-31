import { timingSafeEqual } from "node:crypto";
import { env } from "@workspace/env/server";
import { Logger } from "@workspace/logger";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const logger = new Logger("RevalidateSyncTags");

// Cap the tag count so a caller can't force an unbounded revalidate loop.
const MAX_TAGS = 1000;

// Constant-time secret comparison; length-guarded so buffers match.
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = env.SANITY_REVALIDATE_SECRET;
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  // Fail closed: reject when the shared secret is unset or doesn't match.
  if (!(expected && secret) || !secretsMatch(secret, expected)) {
    logger.warn("Rejected unauthorized revalidate request", {
      hasAuthHeader: Boolean(secret),
      secretConfigured: Boolean(expected),
    });
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request: body must be valid JSON", {
      status: 400,
    });
  }

  const syncTags: unknown = (body as { syncTags?: unknown })?.syncTags;
  if (
    !Array.isArray(syncTags) ||
    syncTags.length === 0 ||
    syncTags.length > MAX_TAGS ||
    !syncTags.every((tag): tag is string => typeof tag === "string")
  ) {
    return new Response(
      "Bad Request: syncTags must be a non-empty array of strings",
      { status: 400 }
    );
  }

  for (const tag of syncTags) {
    // `sanityFetch` tags entries as `sanity:${tag}`; `{ expire: 0 }` = no stale window.
    revalidateTag(`sanity:${tag}`, { expire: 0 });
  }

  return NextResponse.json({ revalidated: true, syncTags });
}
