import { BlogCard } from "@/components/blog-card";
import type { Blog } from "@/types";

export type BlogListProps = {
  blogs: Blog[];
  isLoading?: boolean;
};

export function BlogList({ blogs, isLoading = false }: BlogListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            className="grid w-full grid-cols-1 gap-4"
            key={`skeleton-${index.toString()}`}
          >
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-6 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No blog posts available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2">
      {blogs.map((blog) => (
        <BlogCard blog={blog} key={blog._id} />
      ))}
    </div>
  );
}
