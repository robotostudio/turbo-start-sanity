import { opensearchEnv } from "./env";

export const BLOG_INDEX = opensearchEnv.OPENSEARCH_INDEX;

export const INDEX_SETTINGS = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
    analysis: {
      filter: {
        english_stop: {
          type: "stop",
          stopwords: "_english_",
        },
        english_stemmer: {
          type: "stemmer",
          language: "english",
        },
        english_possessive_stemmer: {
          type: "stemmer",
          language: "possessive_english",
        },
        blog_synonyms: {
          type: "synonym",
          synonyms: [
            "js, javascript",
            "ts, typescript",
            "react, reactjs, react.js",
            "next, nextjs, next.js",
            "node, nodejs, node.js",
            "css, cascading style sheets, stylesheet",
            "html, hypertext markup language",
            "api, application programming interface",
            "db, database",
            "devops, dev ops, development operations",
            "ci, continuous integration",
            "cd, continuous delivery, continuous deployment",
            "ui, user interface",
            "ux, user experience",
            "ai, artificial intelligence",
            "ml, machine learning",
            "seo, search engine optimization",
            "cms, content management system",
            "ssr, server side rendering",
            "ssg, static site generation",
            "spa, single page application",
          ],
        },
        autocomplete_filter: {
          type: "edge_ngram",
          min_gram: 2,
          max_gram: 20,
        },
      },
      analyzer: {
        blog_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: [
            "english_possessive_stemmer",
            "lowercase",
            "english_stop",
            "blog_synonyms",
            "english_stemmer",
          ],
        },
        autocomplete_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "autocomplete_filter"],
        },
        autocomplete_search_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase"],
        },
      },
    },
  },
  mappings: {
    properties: {
      // Sanity document identity
      _id: { type: "keyword" },
      _type: { type: "keyword" },

      // Main searchable fields
      title: {
        type: "text",
        analyzer: "blog_analyzer",
        fields: {
          autocomplete: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "autocomplete_search_analyzer",
          },
          keyword: {
            type: "keyword",
            ignore_above: 256,
          },
        },
      },
      description: {
        type: "text",
        analyzer: "blog_analyzer",
        fields: {
          autocomplete: {
            type: "text",
            analyzer: "autocomplete_analyzer",
            search_analyzer: "autocomplete_search_analyzer",
          },
        },
      },
      slug: {
        type: "keyword",
      },

      // Author (for faceted search)
      authorName: {
        type: "text",
        analyzer: "blog_analyzer",
        fields: {
          keyword: {
            type: "keyword",
            ignore_above: 256,
          },
        },
      },
      authorId: {
        type: "keyword",
      },
      categories: {
        type: "keyword",
      },
      publishedAt: {
        type: "date",
        format: "strict_date_optional_time||epoch_millis",
      },
      image: {
        type: "object",
        enabled: false,
      },
      authors: {
        type: "object",
        enabled: false,
      },
      orderRank: {
        type: "keyword",
      },
      seoHideFromLists: {
        type: "boolean",
      },
    },
  },
} as const;

export type BlogDocument = {
  _id: string;
  _type: "blog";
  title: string;
  description: string | null;
  slug: string;
  authorName: string | null;
  authorId: string | null;
  categories: string[];
  publishedAt: string | null;
  image: {
    id: string | null;
    preview: string | null;
    alt: string;
    hotspot: { x: number; y: number } | null;
    crop: { bottom: number; left: number; right: number; top: number } | null;
  } | null;
  authors: {
    _id: string;
    name: string | null;
    position: string | null;
    image: {
      id: string | null;
      preview: string | null;
      alt: string;
      hotspot: { x: number; y: number } | null;
      crop: {
        bottom: number;
        left: number;
        right: number;
        top: number;
      } | null;
    } | null;
  } | null;
  orderRank: string | null;
  seoHideFromLists: boolean;
};
