import { NextRequest, NextResponse } from "next/server";
import { algoliasearch } from "algoliasearch";
import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_READ_TOKEN!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
  useCdn: false,
});

const algolia = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!,
);

// Prevent duplicate processing
const recentlyProcessed = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const documentId = payload._id;
    const documentType = payload._type;

    // Only handle blog posts
    if (documentType !== "blog") {
      return NextResponse.json({ message: "Not a blog post" });
    }

    // Skip duplicates (within 10 seconds)
    const now = Date.now();
    if (recentlyProcessed.has(documentId)) {
      const lastProcessed = recentlyProcessed.get(documentId)!;
      if (now - lastProcessed < 10000) {
        return NextResponse.json({ message: "Duplicate skipped" });
      }
    }
    recentlyProcessed.set(documentId, now);

    // Fetch the blog post
    const post = await sanityClient.fetch(
      `*[_type == "blog" && _id == $id][0]{
        _id, title, "slug": slug.current, excerpt, publishedAt
      }`,
      { id: documentId },
    );

    if (!post || !post.publishedAt) {
      // Delete from index if not found or unpublished
      await algolia.deleteObjects({
        indexName: "blog_posts",
        objectIDs: [documentId],
      });
      return NextResponse.json({ message: "Removed from index" });
    }

    // Index to Algolia
    await algolia.saveObjects({
      indexName: "blog_posts",
      objects: [
        {
          objectID: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          publishedAt: post.publishedAt,
        },
      ],
    });

    return NextResponse.json({ message: "Indexed successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint working" });
}
