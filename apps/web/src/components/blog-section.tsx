import { FeaturedBlogCard } from "@/components/blog-card";
import { BlogList } from "@/components/blog-list";
import type { Blog } from "@/types";

export type BlogSectionProps = {
  blogs: Blog[];
  title: string;
  isFeatured?: boolean;
};

export function BlogSection({
  blogs,
  title,
  isFeatured = false,
}: BlogSectionProps) {
  if (blogs.length === 0) {
    return null;
  }

  if (isFeatured) {
    return (
      <section className="mx-auto mt-8 mb-12 grid grid-cols-1 gap-8 sm:mt-12 md:mt-16 md:gap-12 lg:mb-20">
        <h2 className="sr-only">{title}</h2>
        {blogs.map((blog) => (
          <FeaturedBlogCard blog={blog} key={blog._id} />
        ))}
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="sr-only">{title}</h2>
      <BlogList blogs={blogs} />
    </section>
  );
}
