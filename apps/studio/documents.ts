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

// A new page opened by id (`/presentation/page/<id>?preview=`) matches no slug,
// so Sanity clears the id and shows "Missing a main document". Resolvers can't
// see the selection, so only the id + preview path Presentation opened on skip
// resolution, until the preview moves; ids it pins later still resolve, so the
// panel keeps following the preview.
// ponytail: assumes the default tool name `presentation`; no upstream hook —
// drop once Sanity's `useMainDocument` stops clearing the id.
let openedOn: { id: string; path: string } | undefined | null = null;

const selectedId = () =>
  window.location.pathname.match(
    /^\/presentation\/(?!intent\/)[^/]+\/([^/]+)/
  )?.[1];

const resolveMainDocument = (
  path: string,
  filter: string,
  params?: Record<string, string>
) => {
  const id = selectedId();
  if (openedOn === null) {
    openedOn = id ? { id, path } : undefined;
  }
  if (openedOn && openedOn.id === id && openedOn.path === path) {
    return undefined;
  }
  openedOn = undefined;
  return { filter, params };
};

export const mainDocuments = defineDocuments([
  {
    route: "/",
    resolve: ({ path }) =>
      resolveMainDocument(path, `_type == "homePage" && _id == "homePage"`),
  },
  {
    route: "/blog",
    resolve: ({ path }) => resolveMainDocument(path, `_type == "blogIndex"`),
  },
  {
    route: "/blog/:slug",
    resolve: ({ params, path }) =>
      resolveMainDocument(path, `_type == "blog" && slug.current == $slug`, {
        slug: `/blog/${params.slug}`,
      }),
  },
  {
    // Matches any depth, reached only when no route above it matched. The
    // wildcard hands `params` an array of segments rather than a string, so
    // the pathname is read off the context instead.
    route: "/*pathSegments",
    resolve: ({ path }) =>
      resolveMainDocument(path, `_type == "page" && slug.current == $slug`, {
        slug: toSlug(path),
      }),
  },
]);
