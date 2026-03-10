import { NextResponse } from "next/server";

import { deleteBlogDocument, upsertBlogDocument } from "@/lib/search/opensearch";
import { fetchBlogByIdForSearch } from "@/lib/search/sanity";

type SanityWebhookPayload = {
  _id?: string;
  _type?: string;
  operation?: "create" | "update" | "delete";
  transition?: string;
};

function isAuthorized(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  const headerSecret = request.headers.get("x-webhook-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  return headerSecret === secret || querySecret === secret;
}

function isDeleteEvent(payload: SanityWebhookPayload) {
  return payload.operation === "delete" || payload.transition === "disappear";
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SanityWebhookPayload;

    if (payload._type !== "blog" || !payload._id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (isDeleteEvent(payload)) {
      await deleteBlogDocument(payload._id);
      return NextResponse.json({ ok: true, deleted: payload._id });
    }

    const blog = await fetchBlogByIdForSearch(payload._id);

    if (!blog) {
      await deleteBlogDocument(payload._id);
      return NextResponse.json({ ok: true, deleted: payload._id });
    }

    await upsertBlogDocument(blog);

    return NextResponse.json({ ok: true, upserted: payload._id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
