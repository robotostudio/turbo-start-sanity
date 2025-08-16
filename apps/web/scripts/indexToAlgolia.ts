import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
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

async function run() {
  try {
    const posts = await sanityClient.fetch(`
      *[_type == "blog"]{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt
      }
    `);

    const objects = posts.map((post: any) => ({
      objectID: post._id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
    }));

    // Save objects to the index using v5 API
    const response = await algolia.saveObjects({
      indexName: "blog_posts",
      objects: objects,
    });

    console.log(`✅ Indexed ${objects.length} posts to Algolia`);
  } catch (error) {
    console.error("❌ Error indexing posts:", error);
    throw error;
  }
}

run().catch(console.error);
