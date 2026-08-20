# @workspace/sanity-blocks

The page-builder block library. Every block ships its Sanity schema, its GROQ
projection, its React component, and its Markdown serializer from one directory,
so both `apps/studio` and `apps/web` stay in sync from a single source.

## Layout

One directory per block, named after the block:

```txt
src/hero/
  hero.schema.ts   # defineType — registered in Studio via `blockSchemas`
  hero.groq.ts     # GROQ projection, imported by packages/sanity/src/query.ts
  index.tsx        # React component rendered by the frontend page builder
  markdown.ts      # Markdown serializer for the `.md` surface
  thumbnail.png    # Insert-menu preview in the Studio
  hero.test.tsx    # Co-located tests
```

`src/internal/` holds shared primitives (rich text, buttons, images, Markdown
helpers) used across blocks. `src/sanity-blocks.ts` re-exports every schema and
exposes the `blockSchemas` array that Studio and the page-builder array
definition both consume.

Video blocks reach for `muxVideoEmbedField()` from `src/internal/schema-fields.ts`
and the `muxVideoEmbedFields` GROQ fragment, which pair the clip with its
playback options, then render it with `MuxVideo` from `src/internal/mux-video`.
Background video takes the bare `muxVideoField()` / `muxVideoFields` instead.
Either way the result is read only through `src/internal/mux.ts` — that module
stega-cleans every value and refuses a playback ID whose encode failed or whose
policy is not public. See the
[Video (Mux) section of CLAUDE.md](../../CLAUDE.md#video-mux).

## Imports

```typescript
import { blockSchemas, heroSchema } from "@workspace/sanity-blocks";
import { heroGroqProjection } from "@workspace/sanity-blocks/hero/hero.groq";
import { HeroBlock } from "@workspace/sanity-blocks/hero/index";
import { pageBuilderToMarkdown } from "@workspace/sanity-blocks/internal/page-builder-to-markdown";
```

## Tests

```sh
pnpm --filter @workspace/sanity-blocks test
pnpm --filter @workspace/sanity-blocks test:coverage
```

Vitest stubs `@workspace/env/client`, `lucide-react`, and `next/link`, so the
suite runs without any environment variables.

## Adding a block

Follow the checklist in [CLAUDE.md](../../CLAUDE.md#page-builder-pattern) — it
covers all eight files that a new block touches, including the Markdown
serializer, without which the block renders blank in `.md` output.
