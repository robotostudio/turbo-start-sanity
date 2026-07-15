export type BlogCategory = {
  label: string;
  value: string;
};

/**
 * Category filter options for the blog index sidebar. The first entry ("All")
 * uses an empty value to represent "no filter"; the remaining values must match
 * the `category` field options defined on the blog document schema.
 */
export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: "All", value: "" },
  { label: "Sanity", value: "sanity" },
  { label: "Skills", value: "skills" },
  { label: "Next.js", value: "nextjs" },
  { label: "SEO", value: "seo" },
  { label: "AEO", value: "aeo" },
  { label: "Changelog", value: "changelog" },
];

export function getBlogCategoryLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return (
    BLOG_CATEGORIES.find((category) => category.value === value)?.label ?? value
  );
}
