import { notFound } from "next/navigation";

import { BlogCard, BlogHeader, FeaturedBlogCard } from "@/components/blog-card";
import { PageBuilder } from "@/components/pagebuilder";
import { sanityFetch } from "@/lib/sanity/live";
import { queryBlogIndexPageData } from "@/lib/sanity/query";
import type { QueryBlogIndexPageDataResult } from "@/lib/sanity/sanity.types";
import { getSEOMetadata } from "@/lib/seo";
import { handleErrors } from "@/utils";

type Blog = NonNullable<QueryBlogIndexPageDataResult>["blogs"][number];

async function fetchBlogPosts() {
  return await handleErrors(sanityFetch({ query: queryBlogIndexPageData }));
}

export async function generateMetadata() {
  const { data: result } = await sanityFetch({
    query: queryBlogIndexPageData,
    stega: false,
  });
  return getSEOMetadata(
    result
      ? {
          title: result?.title ?? result?.seoTitle ?? "",
          description: result?.description ?? result?.seoDescription ?? "",
          slug: result?.slug,
          contentId: result?._id,
          contentType: result?._type,
        }
      : {}
  );
}

export default async function BlogIndexPage() {
  const [res, err] = await fetchBlogPosts();
  if (err || !res?.data) {
    notFound();
  }

  const {
    blogs = [],
    title,
    description,
    pageBuilder = [],
    _id,
    _type,
    displayFeaturedBlogs,
    featuredBlogsCount,
  } = res.data;

  const validFeaturedBlogsCount = featuredBlogsCount
    ? Number.parseInt(featuredBlogsCount, 10)
    : 0;

  if (!blogs.length) {
    return (
      <main className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader description={description} title={title} />
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No blog posts available at the moment.
          </p>
        </div>
        {pageBuilder && pageBuilder.length > 0 && (
          <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
        )}
      </main>
    );
  }

  const shouldDisplayFeaturedBlogs =
    displayFeaturedBlogs && validFeaturedBlogsCount > 0;

  const featuredBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(0, validFeaturedBlogsCount)
    : [];
  const remainingBlogs = shouldDisplayFeaturedBlogs
    ? blogs.slice(validFeaturedBlogsCount)
    : blogs;

  return (
    <main className="bg-background">
      <div className="container mx-auto my-16 px-4 md:px-6">
        <BlogHeader description={description} title={title} />

        {featuredBlogs.length > 0 && (
          <div className="mx-auto mt-8 mb-12 grid grid-cols-1 gap-8 sm:mt-12 md:mt-16 md:gap-12 lg:mb-20">
            {featuredBlogs.map((blog: Blog) => (
              <FeaturedBlogCard blog={blog} key={blog._id} />
            ))}
          </div>
        )}

        {remainingBlogs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2">
            {remainingBlogs.map((blog: Blog) => (
              <BlogCard blog={blog} key={blog._id} />
            ))}
          </div>
        )}
      </div>

      {pageBuilder && pageBuilder.length > 0 && (
        <PageBuilder id={_id} pageBuilder={pageBuilder} type={_type} />
      )}
    </main>
  );
}
