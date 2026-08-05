import { BlogCard } from "@/components/blog-card";
import { BlogGridSkeleton } from "@/components/skeletons";
import type { Blog } from "@/types";

export type BlogListProps = {
  blogs: Blog[];
  isLoading?: boolean;
};

export function BlogList({ blogs, isLoading = false }: BlogListProps) {
  if (isLoading) {
    return <BlogGridSkeleton count={6} />;
  }

  if (blogs.length === 0) {
    return (
      <div className="border border-border py-12 text-center">
        <p className="text-muted-foreground">
          No blog posts available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <BlogCard blog={blog} key={blog._id} />
      ))}
    </div>
  );
}
