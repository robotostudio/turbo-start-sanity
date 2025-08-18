// scripts/indexToAlgolia.ts
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
    // ✅ Fetch all blog posts
    const blogs = await sanityClient.fetch(`
      *[_type == "blog"]{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        categories[]->{
          _id,
          title,
          "slug": slug.current
        }
      }
    `);

    const blogObjects = blogs.map((post: any) => ({
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
    }));

    // ✅ Fetch all categories
    const categories = await sanityClient.fetch(`
      *[_type == "category"]{
        _id,
        title,
        "slug": slug.current,
        description,
        seo
      }
    `);

    const categoryObjects = categories.map((cat: any) => ({
      objectID: cat._id,
      title: cat.title,
      slug: cat.slug,
      description: cat.description,
      seo: cat.seo,
    }));

    // ✅ Save to Algolia
    await algolia.saveObjects({
      indexName: "blog_posts",
      objects: blogObjects,
    });

    await algolia.saveObjects({
      indexName: "categories",
      objects: categoryObjects,
    });

    console.log(
      `✅ Indexed ${blogObjects.length} blogs and ${categoryObjects.length} categories to Algolia`,
    );
  } catch (error) {
    console.error("❌ Error indexing to Algolia:", error);
    throw error;
  }
}

run().catch(console.error);
