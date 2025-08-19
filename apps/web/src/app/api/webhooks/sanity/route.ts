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

    // ===== BLOG =====
    if (documentType === "blog") {
      const post = await sanityClient.fetch(
        `*[_type == "blog" && _id == $id][0]{
          _id,
          title,
          "slug": slug.current,
          excerpt,
          publishedAt,
          categories[]->{
            _id,
            title,
            "slug": slug.current
          },
          featuredPokemon->{
            pokemon {
              id,
              name,
              sprite,
              types
            }
          }
        }`,
        { id: documentId },
      );

      if (!post || !post.publishedAt) {
        await algolia.deleteObject({
          indexName: "blogs_with_relations",
          objectID: documentId,
        });
        return NextResponse.json({
          message: "Blog removed from unified index",
        });
      }

      await algolia.saveObjects({
        indexName: "blogs_with_relations",
        objects: [
          {
            objectID: post._id,
            type: "blog",
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            publishedAt: post.publishedAt,
            categories:
              post.categories?.map((c: any) => ({
                id: c._id,
                title: c.title,
                slug: c.slug,
              })) || [],
            featuredPokemon: post.featuredPokemon?.pokemon
              ? {
                  id: post.featuredPokemon.pokemon.id ?? null,
                  name: post.featuredPokemon.pokemon.name ?? null,
                  sprite: post.featuredPokemon.pokemon.sprite ?? null,
                  types: post.featuredPokemon.pokemon.types ?? [],
                }
              : { id: null, name: null, sprite: null, types: [] },
            _searchableText: `${post.title} ${post.excerpt} ${post.categories?.map((c: any) => c.title).join(" ") || ""} ${post.featuredPokemon?.pokemon?.name || ""}`,
          },
        ],
      });

      return NextResponse.json({
        message: "Blog indexed successfully in unified index",
      });
    }

    // ===== CATEGORY =====
    if (documentType === "category") {
      const cat = await sanityClient.fetch(
        `*[_type == "category" && _id == $id][0]{
          _id,
          title,
          "slug": slug.current,
          description,
          seo
        }`,
        { id: documentId },
      );

      if (!cat) {
        await algolia.deleteObject({
          indexName: "blogs_with_relations",
          objectID: documentId,
        });
        return NextResponse.json({
          message: "Category removed from unified index",
        });
      }

      await algolia.saveObjects({
        indexName: "blogs_with_relations",
        objects: [
          {
            objectID: cat._id,
            type: "category",
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            seo: cat.seo,
            _searchableText: `${cat.title} ${cat.description || ""}`,
          },
        ],
      });

      return NextResponse.json({
        message: "Category indexed successfully in unified index",
      });
    }

    // ===== POKEDEX =====
    if (documentType === "pokedex") {
      const poke = await sanityClient.fetch(
        `*[_type == "pokedex" && _id == $id][0]{
          _id,
          pokemon {
            id,
            name,
            sprite,
            types
          }
        }`,
        { id: documentId },
      );

      if (!poke || !poke.pokemon?.id) {
        await algolia.deleteObject({
          indexName: "blogs_with_relations",
          objectID: documentId,
        });
        return NextResponse.json({
          message: "Pokémon removed from unified index",
        });
      }

      await algolia.saveObjects({
        indexName: "blogs_with_relations",
        objects: [
          {
            objectID: poke._id,
            type: "pokemon",
            pokemonId: poke.pokemon.id,
            name: poke.pokemon.name,
            sprite: poke.pokemon.sprite,
            types: poke.pokemon.types || [],
            _searchableText: `${poke.pokemon.name || ""} ${poke.pokemon.types?.join(" ") || ""}`,
          },
        ],
      });

      return NextResponse.json({
        message: "Pokémon indexed successfully in unified index",
      });
    }

    return NextResponse.json({
      message: "Ignored: not blog, category, or pokedex",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Unified webhook endpoint working" });
}
