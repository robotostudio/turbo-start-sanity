import { defineDocuments } from "sanity/presentation";

// The reverse of `location.ts`: given a preview route, which document is that
// page? Presentation uses this to pin the page's own record above the
// source-map document list, and to follow the panel along when an editor
// navigates inside the preview without clicking anything. Clicking an element
// still wins — that path comes from stega and never reaches these resolvers.
//
// First match wins, so the page catch-all sits last.

// Slugs are stored with their leading slash and full nested path
// (`/about/team`), which is exactly the preview pathname — minus the optional
// trailing slash the route matcher allows through.
const toSlug = (path: string) => path.replace(/\/+$/, "") || "/";

export const mainDocuments = defineDocuments([
  {
    route: "/",
    filter: `_type == "homePage" && _id == "homePage"`,
  },
  {
    route: "/blog",
    filter: `_type == "blogIndex"`,
  },
  {
    route: "/blog/:slug",
    filter: `_type == "blog" && slug.current == $slug`,
    params: ({ params }) => ({ slug: `/blog/${params.slug}` }),
  },
  {
    // `:path*` matches any depth, including the root — reached only when no
    // route above it matched.
    route: "/:path*",
    resolve: ({ path }) => ({
      filter: `_type == "page" && slug.current == $slug`,
      params: { slug: toSlug(path) },
    }),
  },
]);
