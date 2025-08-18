"use client";

import { useState, useMemo, useEffect } from "react";
import { BlogCard, FeaturedBlogCard } from "@/components/blog-card";
import Search from "@/components/Search";
import { usePathname } from "next/navigation";

interface Category {
  _id: string;
  title: string;
  slug: string;
}

interface Blog {
  _id: string;
  title: string;
  excerpt?: string;
  slug: string;
  categories?: Category[];
}

export default function BlogListWithFilters({
  blogs,
  displayFeaturedBlogs,
  featuredBlogsCount,
}: {
  blogs: Blog[];
  displayFeaturedBlogs: boolean;
  featuredBlogsCount: number;
}) {
  const pathname = usePathname();
  const currentCategorySlug = pathname?.split("/blog/category/")[1] || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    if (currentCategorySlug && currentCategorySlug !== "all") {
      setSelectedCategory(currentCategorySlug);
    }
  }, [currentCategorySlug]);

  const categories = useMemo(() => {
    const allCats = blogs.flatMap((b) => b.categories || []);
    const uniqueCats = Array.from(
      new Map(allCats.map((c) => [c._id, c])).values(),
    );
    return [{ _id: "all", title: "All", slug: "all" }, ...uniqueCats];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    if (selectedCategory === "All") return blogs;
    return blogs.filter((b) =>
      b.categories?.some((c) => c.slug === selectedCategory),
    );
  }, [blogs, selectedCategory]);

  const validFeaturedBlogsCount = displayFeaturedBlogs
    ? Number.parseInt(String(featuredBlogsCount))
    : 0;
  const featuredBlogs = displayFeaturedBlogs
    ? filteredBlogs.slice(0, validFeaturedBlogsCount)
    : [];
  const remainingBlogs = displayFeaturedBlogs
    ? filteredBlogs.slice(validFeaturedBlogsCount)
    : filteredBlogs;

  return (
    <div>
      <div className="mt-8 mb-6">
        <Search />
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() =>
              setSelectedCategory(cat._id === "all" ? "All" : cat.slug)
            }
            className={`px-4 py-2 rounded-full border text-sm ${
              selectedCategory === cat.slug ||
              (selectedCategory === "All" && cat._id === "all")
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {featuredBlogs.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:gap-12 mb-12">
          {featuredBlogs.map((blog) => (
            <FeaturedBlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}

      {remainingBlogs.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2">
          {remainingBlogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-6">No blogs found in this category.</p>
      )}
    </div>
  );
}
