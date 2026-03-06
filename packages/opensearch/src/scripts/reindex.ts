import { createClient } from "@sanity/client";
import {
  bulkIndexBlogDocuments,
  clearIndex,
  ensureIndex,
  getIndexStats,
  type BlogDocument,
} from "../index";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";
const SANITY_API_READ_TOKEN = process.env.SANITY_API_READ_TOKEN;

if (!SANITY_PROJECT_ID || !SANITY_DATASET) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET",
  );
  process.exit(1);
}

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: false,
  token: SANITY_API_READ_TOKEN,
});

const BLOG_INDEX_QUERY = /* groq */ `
  *[_type == "blog" && defined(slug.current)] {
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

async function main() {
  console.log("Starting full reindex...");
  console.log(`Sanity project: ${SANITY_PROJECT_ID}/${SANITY_DATASET}`);
  console.log(`OpenSearch URL: ${process.env.OPENSEARCH_URL ?? "http://localhost:9200"}`);
  console.log("");

  // Step 1: Ensure the index exists with correct mappings
  console.log("Ensuring index exists with correct mappings...");
  await ensureIndex({ forceRecreate: true });
  console.log("Index created/recreated");

  // Step 2: Fetch all blogs from Sanity
  console.log("Fetching blog data from Sanity...");
  const blogs: BlogDocument[] = await sanityClient.fetch(BLOG_INDEX_QUERY);
  console.log(`Fetched ${blogs.length} blog documents`);

  if (blogs.length === 0) {
    console.log("No blog documents found. Index will be empty.");
    return;
  }

  // Step 3: Bulk index all documents
  console.log("Indexing documents into OpenSearch...");
  const { indexed, errors } = await bulkIndexBlogDocuments(blogs);
  console.log(`Indexed: ${indexed}, Errors: ${errors}`);

  // Step 4: Verify
  const stats = await getIndexStats();
  console.log("");
  console.log("Index stats:");
  console.log(`Documents: ${stats.documentCount}`);
  console.log(`Index exists: ${stats.indexExists}`);
  console.log("");
  console.log("Reindex complete!");
}

main().catch((err) => {
  console.error("❌ Reindex failed:", err);
  process.exit(1);
});
