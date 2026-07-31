export interface BlogCategoryOption {
  title: string;
  value: string;
}

// Canonical blog category taxonomy shared by the Studio `category` field and
// the frontend filter. Add or rename here and both sides update.
export const BLOG_CATEGORY_OPTIONS: BlogCategoryOption[] = [
  { title: "Sanity", value: "sanity" },
  { title: "Skills", value: "skills" },
  { title: "Next.js", value: "nextjs" },
  { title: "SEO", value: "seo" },
  { title: "AEO", value: "aeo" },
  { title: "Changelog", value: "changelog" },
];
