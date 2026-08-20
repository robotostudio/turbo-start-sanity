# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turbo Start Sanity — a pnpm monorepo (Turborepo) with a Next.js 16 frontend and a Sanity Studio v6 CMS. Uses Biome/Ultracite for linting/formatting.

## Commands

```bash
# Development (both apps)
pnpm dev

# Individual apps
pnpm dev:web          # Next.js on localhost:3000 (Turbopack)
pnpm dev:studio       # Sanity Studio on localhost:3333

# Build
pnpm build            # All packages
pnpm build:web        # Next.js only
pnpm build:studio     # Studio only

# Lint & Format (Biome/Ultracite, NOT ESLint/Prettier)
pnpm lint             # Lint all
pnpm format           # Format all (auto-fix)
pnpm format:check     # Check formatting without fixing
pnpm check-types      # TypeScript type checking

# Per-package lint/format
cd apps/web && pnpm lint
cd apps/studio && pnpm format

# Sanity type generation (run after schema changes)
pnpm type             # Generates types — works from root (turbo) or apps/studio
cd apps/studio && pnpm extract   # Schema extract only (studio-scoped)

# Tests
pnpm test             # Vitest unit tests (currently only @workspace/sanity-blocks)
pnpm test:e2e         # Playwright smoke tests (apps/web, needs a running/deployed site)
```

Note: `pnpm test` at the root is `turbo run test`, which today only reaches
`@workspace/sanity-blocks` — the one package with a `test` script. Run a single
package's suite with `pnpm --filter @workspace/sanity-blocks test`.

## Monorepo Structure

```txt
apps/
  web/         — Next.js 16 (App Router, React 19, React Compiler, Cache Components, Tailwind v4)
  studio/      — Sanity Studio v6 (Vite, styled-components)
packages/
  env/           — @workspace/env — Zod-validated env vars via @t3-oss/env-nextjs
  sanity/        — @workspace/sanity — Shared Sanity client, GROQ queries, live preview, image utils
  sanity-blocks/ — @workspace/sanity-blocks — Block schemas, GROQ projections, React block components, Markdown serializers, Vitest suite
  ui/            — @workspace/ui — Shared UI components (Radix + CVA + Tailwind, shadcn-style)
  tailwind-config/   — @workspace/tailwind-config — Shared Tailwind v4 theme + `cn` utility
  logger/        — @workspace/logger — Structured logger class with context prefixes
  typescript-config/ — Shared TS configs
```

## Architecture

### Data Flow: Sanity → Next.js

1. **Schema** block types defined in `packages/sanity-blocks/src/` and re-exported via `@workspace/sanity-blocks`. Studio registers them via `apps/studio/schemaTypes/index.ts`
2. **Type generation**: `pnpm type` (from repo root via turbo, or in `apps/studio`) generates TS types at `packages/sanity/src/sanity.types.ts`
3. **GROQ queries** live in `packages/sanity/src/query.ts` using `defineQuery` from `next-sanity`, with reusable fragments
4. **Data fetching** uses `sanityFetch` from `packages/sanity/src/live.ts` (wraps `defineLive` for automatic revalidation)
5. **Client** configured in `packages/sanity/src/client.ts` with stega for visual editing

### Page Builder Pattern

The core content model is a **page builder** — an array of typed blocks:

- **Schema source**: `packages/sanity-blocks/src/<block>/` — files are named after the block, e.g. `cta/cta.schema.ts`, `cta/cta.groq.ts`, `cta/index.tsx`, `cta/markdown.ts`, `cta/thumbnail.png`, plus co-located `*.test.tsx` / `*-markdown.test.ts`. All schemas are exported as `blockSchemas` from `packages/sanity-blocks/src/sanity-blocks.ts`
- **Studio side**: `apps/studio/schemaTypes/index.ts` merges `blockSchemas` into the exported `schemaTypes`, and `apps/studio/schemaTypes/definitions/pagebuilder.ts` maps over `blockSchemas` to build the array members — so a block added to `blockSchemas` shows up in the page builder automatically, no manual registration. Its insert-menu grid preview is `/static/thumbnails/preview-<kebab-case-name>.png`, copied from each block's `thumbnail.png` by the studio's `sync-thumbnails` script (runs on `postinstall`)
- **Frontend side**: `apps/web/src/components/pagebuilder.tsx` — renders each `_type` via `renderBlockComponent`. Includes Sanity visual editing data attributes and optimistic updates
- **Block components**: `packages/sanity-blocks/src/<block>/index.tsx` — styled implementations using Tailwind + `@workspace/ui`, imported by `pagebuilder.tsx` from `@workspace/sanity-blocks/<block>/index` and rendered directly. These are the production render layer

To add a new page builder block:

1. Create `packages/sanity-blocks/src/<new-block>/` with `<new-block>.schema.ts` and `<new-block>.groq.ts`
2. Export the schema from `packages/sanity-blocks/src/sanity-blocks.ts` and add it to the `blockSchemas` array — Studio then picks it up automatically through `apps/studio/schemaTypes/index.ts` and `definitions/pagebuilder.ts`
3. Run `pnpm type` (from repo root or `apps/studio`) to regenerate Sanity types
4. Import the block's GROQ projection in `packages/sanity/src/query.ts` and include it in `pageBuilderFragment`
5. Create the styled component as `packages/sanity-blocks/src/<new-block>/index.tsx`
6. Register in `renderBlockComponent` in `apps/web/src/components/pagebuilder.tsx` (imported from `@workspace/sanity-blocks/<new-block>/index`)
7. Add `packages/sanity-blocks/src/<new-block>/markdown.ts` exporting a `<newBlock>ToMarkdown` serializer, then wire it into the `blockToMarkdown` switch in `packages/sanity-blocks/src/internal/page-builder-to-markdown.ts` (a thin dispatcher — the serializers themselves live with their blocks) so the block degrades to semantic Markdown. Reuse `headingToMarkdown` from `internal/markdown.ts` and `portableTextToMarkdown` from `internal/portable-text-to-markdown.ts`, and add a test asserting no JSX leaks. Without this, the new block renders blank in `.md` output
8. Add `packages/sanity-blocks/src/<new-block>/thumbnail.png` so the block has a preview in the Studio insert menu, then run `pnpm --filter studio sync-thumbnails`

### Markdown content negotiation

Any page is also served as Markdown for LLMs/agents: append `.md` to the URL (`/about.md`, `/blog/post.md`, `/index.md`) or send `Accept: text/markdown`. `apps/web/src/proxy.ts` rewrites those requests to `apps/web/src/app/api/markdown/route.ts`, which fetches the page's Sanity data and serializes it via `pageBuilderToMarkdown` — the Markdown counterpart of `renderBlockComponent`. Because it serializes structured data (never React), components can't leak as raw `<Component/>` tags; unknown block types return `""`. See step 7 above to support a new block.

### Video (Mux)

Video is hosted on Mux, not stored as a Sanity file asset. `sanity-plugin-mux-input` (registered in `apps/studio/sanity.config.ts`) adds the `mux.video` field type; use the `muxVideoField()` helper from `packages/sanity-blocks/src/internal/schema-fields.ts` (it takes an optional `validation`) and the `muxVideoFields` GROQ fragment, which resolves the referenced `mux.videoAsset` down to `{ playbackId, aspectRatio, status, thumbTime, title, policy }`. One upload covers every device — Mux serves an adaptive HLS ladder — so schemas carry a single video field, not a per-format set.

Helpers live in `packages/sanity-blocks/src/internal/mux.ts` and every value that reaches a URL or a CSS declaration is stega-cleaned there, because Visual Editing encodes invisible characters into strings. `muxPlaybackId` is the only way to read a playback ID, and it withholds one when Mux reports `errored` or when the playback policy is anything but `public` (signed playback needs JWTs this starter does not mint). It deliberately does **not** gate on `status === "ready"`: that field is patched by a poll running in the editor's browser tab, so it stalls at `preparing` whenever the tab closes mid-encode, and gating on it would hide a playable video indefinitely.

Upload settings are left on the plugin defaults (`video_quality: "plus"`, 1080p ceiling, public playback); every upload is billed, so each project should pick its own tier in `sanity.config.ts`. Mux API credentials are **not** env vars: an editor pastes the token ID and secret into the plugin's setup screen the first time they upload, and the Studio stores them in the dataset as `secrets.mux`. That is a trade, not just a convenience — on a public dataset the secret key is readable by anyone who can query it, so give the token only Mux Video read/write, and keep the dataset private if that matters.

Two render paths, deliberately different:

- **Content video** — `internal/mux-video.tsx` renders a facade: the Mux still and a play button, with `@mux/mux-player-react` behind a `next/dynamic` import that only resolves once a visitor presses play. Until then neither the player chunk nor the video bytes Mux bills are spent on someone who never watches. `disableTracking` keeps Mux Data off both paths — drop it and set an `envKey` to turn analytics on. The block renders its copy even when no video resolves, matching the Markdown serializer.
- **Hero background** — the bare `@mux/mux-video-react` element behind a `next/dynamic` import, so hls.js stays off pages with no video. It autoplays, which makes it the one surface billed for Mux delivery on every page view, and its `maxResolution` / `renditionOrder` props are pinned for a reason the comment beside them explains. A variant is a Mux clip, a picture, or both; leave the picture empty and the clip's own still stands in at the editor's `thumbTime`.

### Sanity Document Types

**Singletons** (one instance each): `homePage`, `blogIndex`, `settings`, `footer`, `navbar`
**Documents**: `blog`, `page`, `faq`, `author`, `redirect`
**Pages** use nested slug-based structure (`apps/studio/components/nested-pages-structure.ts`)

### Environment Variables

Canonical source of truth is `apps/web/.env.example` and `apps/studio/.env.example`. Copy them to `.env` (or `.env.local`) in the same folder.

**`apps/web`** (validated by `@workspace/env`):

- Required: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SANITY_STUDIO_URL`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`
- Optional: `SANITY_REVALIDATE_SECRET` (shared secret for the `/api/revalidate-sync-tags` webhook; the route fails closed when unset)
- `NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` are also validated but default to localhost, so they need no local value

Caveat: `SANITY_API_WRITE_TOKEN` is currently required by `packages/env/src/server.ts` even though no runtime code reads it. `apps/web/next.config.ts` imports `@workspace/env/server`, so `next dev` and `next build` both fail fast if it is unset.

**`apps/studio`** (plain `process.env`, loaded via `dotenv`/Vite — not `@workspace/env`):

- Required: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`
- Optional: `SANITY_STUDIO_TITLE`, `SANITY_STUDIO_API_VERSION` (defaults to `2025-05-08` in `apps/studio/utils/constant.ts`), `SANITY_STUDIO_APP_ID` (written back after the first `sanity deploy`), `SANITY_STUDIO_PRESENTATION_URL` (required whenever `NODE_ENV` is not `development` — `utils/helper.ts` returns `http://localhost:3000` in development and throws otherwise, so an unset or `test` `NODE_ENV` throws too)
- `NEXT_PUBLIC_SITE_URL` and `SANITY_REVALIDATE_SECRET` are read only by the deployed Sanity Function `apps/studio/functions/invalidate-tags`, not by the Studio itself

Web env vars are Zod-validated at startup via `@workspace/env` (`@workspace/env/client` and `@workspace/env/server`).

### Types Strategy

All frontend types derive from generated Sanity types. `apps/web/src/types.ts` extracts narrow types from query results using `Extract`, `NonNullable`, and index access — never manually duplicate Sanity shapes.

### Visual Editing & Live Preview

- Sanity Presentation Tool configured in `sanity.config.ts` with `presentationTool`
- Next.js uses `VisualEditing` from `next-sanity/visual-editing` in layout (draft mode only)
- `createDataAttribute` used throughout page builder for click-to-edit in Presentation
- `SanityLive` component enables automatic content revalidation

## Conventions

### File Naming

- **kebab-case** for all files: `feature-cards-icon.ts`, `blog-card.tsx`
- `.tsx` for React components, `.ts` for utilities

### Sanity Schema

- Always use `defineType`, `defineField`, `defineArrayMember` from `sanity`
- Include `description` on every field (written for non-technical users)
- Icons: prefer `@sanity/icons`, fall back to `lucide-react`
- GROQ: don't expand images unless explicitly needed. Use `defineQuery` from `next-sanity`

### Frontend

- Prefer `grid` over `flex` unless two sibling elements
- Use `SanityImage` component for Sanity images (from `sanity-image` library)
- Use `SanityButtons` resolver for button arrays
- Shared UI components in `@workspace/ui` (Radix + CVA pattern)

### Formatting (Biome)

- Double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char line width
- Import ordering: node/packages → blank line → aliases/paths
- `noConsole: warn`, `noExplicitAny: warn`
- Use `@workspace/logger` Logger class instead of raw `console.*`

### Node/Runtime

- Node >= 22.12 required (`engines.node` in the root `package.json`)
- pnpm 10.32.1, pinned via `packageManager` — enable with `corepack enable`
- Turborepo handles task orchestration — `transit` task runs before lint/format/check-types
