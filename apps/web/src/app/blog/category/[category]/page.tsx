import { notFound } from "next/navigation";
import { BlogHeader } from "@/components/blog-card";
import { PageBuilder } from "@/components/pagebuilder";
import { sanityFetch } from "@/lib/sanity/live";
import { queryBlogPostsByCategory } from "@/lib/sanity/query";
import BlogListWithFilters from "@/components/BlogWithFilters";

interface Props {
  params: { category: string };
}

export default async function BlogCategoryPage({ params }: Props) {
  const categorySlug = params.category;

  const { data: result } = await sanityFetch({
    query: queryBlogPostsByCategory,
    params: { categorySlug },
  });

  if (!result?.posts) notFound();

  return (
    <main className="container my-16 mx-auto px-4 md:px-6">
      <BlogHeader
        title={`Category: ${result.category?.title}`}
        description={result.category?.description || ""}
      />
      <BlogListWithFilters
        blogs={result.posts}
        displayFeaturedBlogs={false}
        featuredBlogsCount={0}
      />
      {result?.pageBuilder?.length > 0 && (
        <PageBuilder
          pageBuilder={result.pageBuilder}
          id={result.category._id}
          type="category"
        />
      )}
    </main>
  );
}
