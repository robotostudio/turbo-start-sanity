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
          <BlogCard blog={null} key={`skeleton-${index.toString()}`} />
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
