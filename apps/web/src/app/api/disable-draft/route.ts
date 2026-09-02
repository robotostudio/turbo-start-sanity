import { internalPathOnly } from "@workspace/sanity-blocks/internal/safe-href";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // `redirect()` accepts absolute URLs, so an unchecked `?slug=` is an open one.
  const redirectUrl = internalPathOnly(
    request.nextUrl.searchParams.get("slug"),
    request.url
  );

  (await draftMode()).disable();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  redirect(redirectUrl);
}
