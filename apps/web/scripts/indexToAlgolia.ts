// scripts/indexToAlgolia.ts
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { algoliasearch } from "algoliasearch"; // ✅ correct import
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
    console.log("🔄 Fetching blogs with categories + Pokémon...");
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
      "slug": slug.current,
      description,
      seo
    },
    featuredPokemon->{
      pokemon {
        id,
        name,
        sprite,
        types
      }
    }
  }
`);

    console.log(`📝 Found ${blogs.length} blogs`);

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
        description: c.description,
        seo: c.seo,
      })),
      featuredPokemon: post.featuredPokemon?.pokemon
        ? {
            id: post.featuredPokemon.pokemon.id ?? null,
            name: post.featuredPokemon.pokemon.name ?? null,
            sprite: post.featuredPokemon.pokemon.sprite ?? null,
            types: post.featuredPokemon.pokemon.types ?? null,
          }
        : { id: null, name: null, sprite: null, types: null },
    }));

    console.log(
      "📝 Example blog object with embedded category & Pokémon:",
      JSON.stringify(blogObjects[0], null, 2),
    );

    if (blogObjects.length > 0) {
      console.log(
        "🚀 Indexing blogs with categories + Pokémon into Algolia...",
      );
      const result = await algolia.saveObjects({
        indexName: "blogs_with_relations",
        objects: blogObjects,
      });
      console.log("✅ Indexing result:", result);
    } else {
      console.log("⚠️ No blogs to index");
    }
  } catch (error) {
    console.error("❌ Error indexing to Algolia:", error);
    throw error;
  }
}

run().catch(console.error);
