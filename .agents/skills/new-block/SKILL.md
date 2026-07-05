---
name: new-block
description: Scaffold a new page builder block for Turbo Start Sanity end-to-end — Sanity schema, GROQ projection, styled React component, Markdown serializer, tests, and all registrations. Use when asked to add, create, or scaffold a new page builder block, section, or content module (e.g. "add a testimonials block", "create a logo cloud section", "/new-block stats").
---

# New Page Builder Block

Scaffold a complete page builder block in one pass. Every block touches three
workspaces — `packages/sanity-blocks` (source of truth), `packages/sanity`
(GROQ), and `apps/web` (rendering) — plus generated types. Studio registration
is automatic once the schema joins `blockSchemas`.

> Credit: adapted for Turbo Start Sanity from Michael's `/new-module` skill for
> SanityPress — <https://sanitypress.dev/blog/new-module-skill-claude-code>.

## Inputs

Before writing files, establish:

1. **Block name** — two forms, used consistently everywhere:
   - `camelCase` schema type name, e.g. `logoCloud` (matches `_type`)
   - `kebab-case` directory/file name, e.g. `logo-cloud`
2. **Fields** — what content editors manage. If the request doesn't say, ask.
   Reuse shared field helpers from
   `packages/sanity-blocks/src/internal/schema-fields.ts`
   (`buttonsField`, `definePortableTextField`, etc.) before defining new shapes.
3. **An icon** — prefer `@sanity/icons`, fall back to `lucide-react`.

Study the closest existing block in `packages/sanity-blocks/src/` (e.g. `cta`
for text+buttons, `image-link-cards` for card grids, `faq-accordion` for
nested arrays) and mirror its structure and idioms.

## Steps

Work through all steps in order — a block missing any registration renders as
"Component not found" on the web or blank in `.md` output.

### 1. Create the block directory

`packages/sanity-blocks/src/<kebab>/` containing:

**`<kebab>.schema.ts`** — the Sanity schema:

```ts
import { StarIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const logoCloudSchema = defineType({
  name: "logoCloud",
  type: "object",
  icon: StarIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The large text that is the primary focus of the block",
    }),
    // ...more fields — every field needs a `description` written for
    // non-technical editors
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({
      title,
      subtitle: "Logo Cloud",
    }),
  },
});
```

**`<kebab>.groq.ts`** — the GROQ projection, reusing fragments from
`../internal/groq-fragments` (`richTextFragment`, `buttonsFragment`,
`imageFragment`, …). Don't expand images unless the component needs the
expanded fields:

```ts
import { buttonsFragment, richTextFragment } from "../internal/groq-fragments";

export const logoCloudGroqProjection = /* groq */ `
  _type == "logoCloud" => {
    ...,
    ${richTextFragment},
    ${buttonsFragment},
  }
`;
```

**`index.tsx`** — the styled React component (Tailwind v4 +
`@workspace/ui`). Define an explicit props interface with all fields
optional/nullable — the web app asserts the generated query type onto it, so
looser is safer. Conventions: wrap in `<section>` with its own
`<div className="container">` rail, prefer `grid` over `flex` unless two
siblings, use `SanityImage` / `SanityButtons` / `RichText` from
`../internal/*`:

```tsx
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";

export interface LogoCloudBlockProps {
  richText?: RichTextValue;
  title?: string | null;
}

export function LogoCloudBlock({
  title,
  richText,
}: Readonly<LogoCloudBlockProps>) {
  return (
    <section className="my-6 md:my-16" id="logo-cloud">
      <div className="container">
        <h2 className="text-balance font-semibold text-3xl md:text-5xl">
          {title}
        </h2>
        <RichText richText={richText} />
      </div>
    </section>
  );
}
```

**`markdown.ts`** — the Markdown serializer, composing helpers from
`../internal/markdown` (`headingToMarkdown`, `eyebrowToMarkdown`,
`buttonsToMarkdown`, `joinSections`) and
`../internal/portable-text-to-markdown`:

```ts
import {
  type MarkdownBlock,
  type MarkdownOptions,
  headingToMarkdown,
  joinSections,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function logoCloudToMarkdown(
  block: MarkdownBlock,
  options: MarkdownOptions
): string {
  return joinSections([
    headingToMarkdown(block.title, 2),
    portableTextToMarkdown(block.richText, options),
  ]);
}
```

**`<kebab>.test.tsx`** — render the component with `renderToStaticMarkup`
and assert primary content appears (see `cta/cta.test.tsx`).

**`<kebab>-markdown.test.tsx`** — cover: empty block returns `""`, fields
serialize joined by blank lines, markdown chars are escaped, and **no HTML/JSX
leaks** (`expect(result).not.toMatch(/<[A-Za-z]/)`). Mirror
`cta/cta-markdown.test.tsx`.

### 2. Register in the package root

In `packages/sanity-blocks/src/sanity-blocks.ts`: import the schema, add a
named `export`, and append it to the `blockSchemas` array. This alone
registers the block in Studio — `apps/studio/schemaTypes/index.ts` and
`definitions/pagebuilder.ts` both map over `blockSchemas`.

No `package.json` edit is needed: the package's wildcard exports
(`./*/index`, `./*.groq`, `./*.schema`) already cover the new directory.

### 3. Add the GROQ projection to the shared query

In `packages/sanity/src/query.ts`: import
`<camel>GroqProjection` from `@workspace/sanity-blocks/<kebab>/<kebab>.groq`
and add it to `pageBuilderFragment` alongside the existing projections.

### 4. Regenerate Sanity types

```bash
pnpm type   # from repo root (turbo) or apps/studio
```

This updates `packages/sanity/src/sanity.types.ts`; the web app's
`PagebuilderType<"<camel>">` in `apps/web/src/types.ts` picks the new block up
automatically — never hand-write Sanity shapes.

### 5. Register the web renderer

In `apps/web/src/components/pagebuilder.tsx`: import the component from
`@workspace/sanity-blocks/<kebab>/index` and add a `case` to
`renderBlockComponent`:

```tsx
case "logoCloud":
  return <LogoCloudBlock {...(block as PagebuilderType<"logoCloud">)} />;
```

### 6. Register the Markdown serializer

In `packages/sanity-blocks/src/internal/page-builder-to-markdown.ts`: import
`<camel>ToMarkdown` from the block's `markdown.ts` and add a `case` to the
`blockToMarkdown` switch. Without this the block renders blank in `.md`
content negotiation (`/page.md`, `Accept: text/markdown`).

### 7. Studio insert-menu thumbnail

The page builder insert menu looks for
`apps/studio/static/thumbnails/preview-<kebab>.png`, synced at install time
from `packages/sanity-blocks/src/<kebab>/thumbnail.png` by
`pnpm --filter studio sync-thumbnails`. Generate one with the
`generate-thumbnails-agentic` skill if available, or note in the PR that the
thumbnail is pending — the block works without it; the menu tile just has no
preview image.

### 8. Verify

```bash
pnpm --filter @workspace/sanity-blocks test   # component + markdown tests
pnpm check-types                              # fails if a registration is missing
pnpm format                                   # Biome, auto-fix
pnpm lint
```

## Checklist

- [ ] `packages/sanity-blocks/src/<kebab>/` — schema, groq, index.tsx, markdown.ts, two test files
- [ ] Every schema field has a `description`
- [ ] Exported + appended to `blockSchemas` in `sanity-blocks.ts`
- [ ] Projection added to `pageBuilderFragment` in `packages/sanity/src/query.ts`
- [ ] `pnpm type` run — generated types include the block
- [ ] `case` added in `renderBlockComponent` (`apps/web/src/components/pagebuilder.tsx`)
- [ ] `case` added in `blockToMarkdown` (`internal/page-builder-to-markdown.ts`)
- [ ] Thumbnail added or flagged as pending
- [ ] Tests, `check-types`, and lint pass
