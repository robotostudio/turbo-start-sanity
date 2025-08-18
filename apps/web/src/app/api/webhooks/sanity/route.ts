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

    const now = Date.now();
    if (recentlyProcessed.has(documentId)) {
      const lastProcessed = recentlyProcessed.get(documentId)!;
      if (now - lastProcessed < 10000) {
        return NextResponse.json({ message: "Duplicate skipped" });
      }
    }
    recentlyProcessed.set(documentId, now);

    // ✅ Handle Blog Posts
    if (documentType === "blog") {
      const post = await sanityClient.fetch(
        `*[_type == "blog" && _id == $id][0]{
          _id, title, "slug": slug.current, excerpt, publishedAt,
          categories[]->{ _id, title, "slug": slug.current }
        }`,
        { id: documentId },
      );

      if (!post || !post.publishedAt) {
        await algolia.deleteObjects({
          indexName: "blog_posts",
          objectIDs: [documentId],
        });
        return NextResponse.json({ message: "Blog removed from index" });
      }

      await algolia.saveObjects({
        indexName: "blog_posts",
        objects: [
          {
            objectID: post._id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            publishedAt: post.publishedAt,
            categories: post.categories?.map((c: any) => ({
              id: c._id,
              title: c.title,
              slug: c.slug,
            })),
          },
        ],
      });

      return NextResponse.json({ message: "Blog indexed successfully" });
    }

    // ✅ Handle Categories
    if (documentType === "category") {
      const cat = await sanityClient.fetch(
        `*[_type == "category" && _id == $id][0]{
          _id, title, "slug": slug.current, description, seo
        }`,
        { id: documentId },
      );

      if (!cat) {
        await algolia.deleteObjects({
          indexName: "categories",
          objectIDs: [documentId],
        });
        return NextResponse.json({ message: "Category removed from index" });
      }

      await algolia.saveObjects({
        indexName: "categories",
        objects: [
          {
            objectID: cat._id,
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            seo: cat.seo,
          },
        ],
      });

      return NextResponse.json({ message: "Category indexed successfully" });
    }

    return NextResponse.json({ message: "Ignored: not blog or category" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint working" });
}
