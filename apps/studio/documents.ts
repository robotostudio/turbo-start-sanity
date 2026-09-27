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

const resolveMainDocument = (
  filter: string,
  params?: Record<string, string>
) =>
  /\/presentation\/[^/]+\/[^/]+(?:\/|$)/.test(window.location.pathname)
    ? undefined
    : { filter, params };

export const mainDocuments = defineDocuments([
  {
    route: "/",
    resolve: () =>
      resolveMainDocument(`_type == "homePage" && _id == "homePage"`),
  },
  {
    route: "/blog",
    resolve: () => resolveMainDocument(`_type == "blogIndex"`),
  },
  {
    route: "/blog/:slug",
    resolve: ({ params }) =>
      resolveMainDocument(`_type == "blog" && slug.current == $slug`, {
        slug: `/blog/${params.slug}`,
      }),
  },
  {
    // Matches any depth, reached only when no route above it matched. The
    // wildcard hands `params` an array of segments rather than a string, so
    // the pathname is read off the context instead.
    route: "/*pathSegments",
    resolve: ({ path }) =>
      resolveMainDocument(`_type == "page" && slug.current == $slug`, {
        slug: toSlug(path),
      }),
  },
]);
