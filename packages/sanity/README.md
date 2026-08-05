# @workspace/sanity

Shared Sanity CMS utilities for the monorepo: client configuration, GROQ queries, image URLs, and live preview.

## Usage

```typescript
// Client and image URL builder
import { client, urlFor } from "@workspace/sanity/client";

// GROQ queries
import { queryHomePageData, queryBlogPaths } from "@workspace/sanity/query";

// Live preview and data fetching
import { sanityFetch, SanityLive } from "@workspace/sanity/live";

// Generated TypeScript types
import type { QueryHomePageDataResult } from "@workspace/sanity/types";
```

## Exports

| Export     | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `./client` | Sanity client instance and `urlFor` image URL builder                       |
| `./query`  | All GROQ query definitions                                                  |
| `./live`   | `sanityFetch` for data fetching and `SanityLive` component for live preview |
| `./types`  | Auto-generated TypeScript types from Sanity schemas                         |

## Features

- Pre-configured Sanity client with stega support for visual editing
- Type-safe GROQ queries with TypeGen integration
- Live preview support via `next-sanity`
- `urlFor` for building CDN image URLs (resize, crop, format — `@sanity/image-url`)

## Images

Image handling is split across two packages:

| Need | Where |
| --- | --- |
| A CDN URL with transforms, e.g. `urlFor(img).width(800).url()` | `@workspace/sanity/client` (here) |
| Rendering an image — responsive srcset, LQIP, hotspot/crop, SVG passthrough | `SanityImage` in `@workspace/sanity-blocks/internal/sanity-image` |

`SanityImage` also exports `resolveAssetId` (validates the asset ref and strips
the stray `drafts.` prefix the media library can add) and `getImageDimensions`
(reads intrinsic size out of the asset id for aspect-ratio-normalized logos).
