import { BLOG_CATEGORY_OPTIONS } from "@workspace/sanity-blocks/internal/blog-categories";

export type BlogCategory = {
  label: string;
  value: string;
};

// Sidebar filter options from the shared taxonomy (can't drift from the Studio
// schema). "All" uses an empty value to mean "no filter".
export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: "All", value: "" },
  ...BLOG_CATEGORY_OPTIONS.map(({ title, value }) => ({
    label: title,
    value,
  })),
];

export function getBlogCategoryLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return (
    BLOG_CATEGORIES.find((category) => category.value === value)?.label ?? value
  );
}
