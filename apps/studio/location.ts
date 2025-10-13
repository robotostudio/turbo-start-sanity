import { defineLocations } from "sanity/presentation";

export const locations = {
  blog: defineLocations({
    select: {
      title: "title",
      slug: "slug.current",
    },
    resolve: (doc) => ({
      locations: [
        {
          title: doc?.title || "Untitled",
          href: `${doc?.slug}`,
        },
        {
          title: "Blog",
          href: "/blog",
        },
      ],
    }),
  }),
  home: defineLocations({
    select: {
      title: "title",
      slug: "slug.current",
    },
    resolve: () => ({
      locations: [
        {
          title: "Home",
          href: "/",
        },
      ],
    }),
  }),
  page: defineLocations({
    select: {
      title: "title",
      slug: "slug.current",
    },
    resolve: (doc) => ({
      locations: [
        {
          title: doc?.title || "Untitled",
          href: `${doc?.slug}`,
        },
      ],
    }),
  }),
};
