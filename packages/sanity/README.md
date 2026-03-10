# @workspace/sanity

Shared Sanity CMS utilities for the monorepo, including client configuration, GROQ queries, and image processing.

## Usage

```typescript
// Client and image URL builder
import { client, urlFor } from "@workspace/sanity/client";

// GROQ queries
import { queryHomePageData, queryBlogPaths } from "@workspace/sanity/query";

// Live preview and data fetching
import { sanityFetch, SanityLive } from "@workspace/sanity/live";

// Image processing utilities
import { processImageData, SANITY_BASE_URL } from "@workspace/sanity/image";

// Generated TypeScript types
import type { QueryHomePageDataResult } from "@workspace/sanity/types";
```

## Exports

| Export     | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `./client` | Sanity client instance and `urlFor` image URL builder                       |
| `./query`  | All GROQ query definitions                                                  |
| `./live`   | `sanityFetch` for data fetching and `SanityLive` component for live preview |
| `./image`  | Image processing utilities and `SANITY_BASE_URL` constant                   |
| `./types`  | Auto-generated TypeScript types from Sanity schemas                         |

## Features

- Pre-configured Sanity client with stega support for visual editing
- Type-safe GROQ queries with TypeGen integration
- Live preview support via `next-sanity`
- Image processing with hotspot and crop support
