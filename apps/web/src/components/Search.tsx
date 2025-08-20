"use client";

import { useState, useEffect } from "react";
import { searchClient } from "@/lib/algolia";
import Link from "next/link";

interface BlogPost {
  objectID: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
}

const searchCache = new Map<string, BlogPost[]>();

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (searchCache.has(query)) {
      setResults(searchCache.get(query)!);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await searchClient.search({
          requests: [{ indexName: "blogs_with_relations", query }],
        });

        const hits = (response.results[0]?.hits as BlogPost[]) || [];
        setResults(hits);
        searchCache.set(query, hits);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search blog posts..."
        className="w-full border rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && query.trim() && (
        <p className="mt-3 text-sm text-gray-500">Searching...</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-3">
          {results.map((post) => (
            <li
              key={post.objectID}
              className="p-4 border rounded-lg hover:shadow-md bg-white"
            >
              <Link href={`${post.slug}`}>
                <h3 className="font-semibold text-gray-900 hover:text-blue-600 mb-1">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-600">{post.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {query && !loading && results.length === 0 && (
        <p className="mt-4 text-gray-500">No results found for "{query}"</p>
      )}
    </div>
  );
}
