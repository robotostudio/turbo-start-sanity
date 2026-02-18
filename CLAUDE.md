# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turbo Start Sanity — a pnpm monorepo (Turborepo) with a Next.js 16 frontend and Sanity v5 CMS Studio. Uses Biome/Ultracite for linting/formatting.

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

# Sanity type generation (run from apps/studio after schema changes)
pnpm type             # Extracts schema + generates types
pnpm extract          # Schema extract only
```

## Monorepo Structure

```
apps/
  web/         — Next.js 16 (App Router, React 19, React Compiler, Tailwind v4)
  studio/      — Sanity Studio v5 (Vite, styled-components)
packages/
  env/         — @workspace/env — Zod-validated env vars via @t3-oss/env-nextjs
  sanity/      — @workspace/sanity — Shared Sanity client, GROQ queries, live preview, image utils
  ui/          — @workspace/ui — Shared UI components (Radix + CVA + Tailwind, shadcn-style)
  logger/      — @workspace/logger — Structured logger class with context prefixes
  typescript-config/ — Shared TS configs
```

## Architecture

### Data Flow: Sanity → Next.js

1. **Schema** defined in `apps/studio/schemaTypes/` (documents, blocks, definitions)
2. **Type generation**: `pnpm type` in studio extracts schema → generates TS types at `packages/sanity/src/sanity.types.ts`
3. **GROQ queries** live in `packages/sanity/src/query.ts` using `defineQuery` from `next-sanity`, with reusable fragments
4. **Data fetching** uses `sanityFetch` from `packages/sanity/src/live.ts` (wraps `defineLive` for automatic revalidation)
5. **Client** configured in `packages/sanity/src/client.ts` with stega for visual editing

### Page Builder Pattern

The core content model is a **page builder** — an array of typed blocks:

- **Studio side**: `apps/studio/schemaTypes/blocks/` — each block is a `defineType({ type: 'object' })`. Registered in `blocks/index.ts` → fed to `definitions/pagebuilder.ts`
- **Frontend side**: `apps/web/src/components/pagebuilder.tsx` — maps `_type` to React component via `BLOCK_COMPONENTS` record. Includes Sanity visual editing data attributes and optimistic updates
- **Block components**: `apps/web/src/components/sections/` — one file per block type (hero, cta, faq-accordion, etc.)

To add a new page builder block:
1. Create schema in `apps/studio/schemaTypes/blocks/new-block.ts`
2. Add to `apps/studio/schemaTypes/blocks/index.ts` array
3. Run `pnpm type` in studio
4. Add GROQ fragment in `packages/sanity/src/query.ts` and include in `pageBuilderFragment`
5. Create component in `apps/web/src/components/sections/`
6. Register in `BLOCK_COMPONENTS` in `apps/web/src/components/pagebuilder.tsx`

### Sanity Document Types

**Singletons** (one instance each): `homePage`, `blogIndex`, `settings`, `footer`, `navbar`
**Documents**: `blog`, `page`, `faq`, `author`, `redirect`
**Pages** use nested slug-based structure (`apps/studio/components/nested-pages-structure.tsx`)

### Environment Variables

**`apps/web/.env.local`**: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SANITY_STUDIO_URL`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`

**`apps/studio/.env.local`**: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_TITLE`, `SANITY_STUDIO_PRESENTATION_URL`, `SANITY_STUDIO_API_VERSION`

All env vars are Zod-validated at startup via `@workspace/env` (client and server exports).

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
- Node >= 22 required
- pnpm 10.28.0 (corepack)
- Turborepo handles task orchestration — `transit` task runs before lint/format/check-types
