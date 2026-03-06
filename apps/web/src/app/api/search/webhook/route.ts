import { createClient } from "@sanity/client";
import {
  deleteBlogDocument,
  ensureIndex,
  indexBlogDocument,
  opensearchEnv,
  type BlogDocument,
} from "@workspace/opensearch";
import { type NextRequest, NextResponse } from "next/server";
import * as crypto from "node:crypto";

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN!,
});

const BLOG_DOCUMENT_QUERY = /* groq */ `
  *[_type == "blog" && _id == $id][0] {
    _id,
    _type,
    title,
    description,
    "slug": slug.current,
    "categories": coalesce(categories, []),
    orderRank,
    publishedAt,
    "seoHideFromLists": coalesce(seoHideFromLists, false),
    "authorName": authors[0]->name,
    "authorId": authors[0]->_id,
    image {
      "id": asset._ref,
      "preview": asset->metadata.lqip,
      "alt": coalesce(alt, asset->altText, caption, asset->originalFilename, "untitled"),
      hotspot { x, y },
      crop { bottom, left, right, top }
    },
    "authors": authors[0]->{
      _id,
      name,
      position,
      image {
        "id": asset._ref,
        "preview": asset->metadata.lqip,
        "alt": coalesce(alt, asset->altText, caption, asset->originalFilename, "untitled"),
        hotspot { x, y },
        crop { bottom, left, right, top }
      }
    }
  }
`;

function isValidSignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest),
    );
  } catch {
    return false;
  }
}

type WebhookBody = {
  _id?: string;
  _type?: string;
  operation?: "create" | "update" | "delete";
};

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = opensearchEnv.SANITY_WEBHOOK_SECRET;

    const rawBody = await request.text();

    if (webhookSecret) {
      const signature = request.headers.get("sanity-webhook-signature");
      if (!isValidSignature(rawBody, signature, webhookSecret)) {
        console.warn("[webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn(
        "[webhook] SANITY_WEBHOOK_SECRET is not configured. " +
          "Webhook requests are NOT authenticated. " +
          "Set SANITY_WEBHOOK_SECRET to secure this endpoint.",
      );
    }

    const body: WebhookBody = JSON.parse(rawBody);
    const { _id, _type, operation } = body;

    if (!_id || _type !== "blog") {
      return NextResponse.json(
        { message: "Ignored: not a blog document" },
        { status: 200 },
      );
    }

    await ensureIndex();

    if (operation === "delete") {
      const deleteId = _id.replace(/^drafts\./, "");
      await deleteBlogDocument(deleteId);
      console.log(`[webhook] Deleted blog ${deleteId} from index`);
      return NextResponse.json({ message: "Deleted from index" });
    }

    const publishedId = _id.replace(/^drafts\./, "");
    const doc: BlogDocument | null = await sanityClient.fetch(
      BLOG_DOCUMENT_QUERY,
      { id: publishedId },
    );

    if (!doc || !doc.slug) {
      await deleteBlogDocument(publishedId);
      console.log(
        `[webhook] Blog ${publishedId} not found or has no slug — removed from index`,
      );
      return NextResponse.json({
        message: "Removed from index (no published version)",
      });
    }

    await indexBlogDocument(doc);
    console.log(`[webhook] Indexed blog ${doc._id}: "${doc.title}"`);

    return NextResponse.json({ message: "Indexed successfully" });
  } catch (error) {
    console.error("[webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", handler: "sanity-webhook" });
}
