---
name: new-block
description: Scaffold a new page builder block for Turbo Start Sanity end-to-end — Sanity schema, GROQ projection, styled React component, Markdown serializer, tests, and all registrations. Use when asked to add, create, or scaffold a new page builder block, section, or content module (e.g. "add a testimonials block", "create a pricing table section", "/new-block stats").
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
   - `camelCase` schema type name, e.g. `pricingTable` (matches `_type`)
   - `kebab-case` directory/file name, e.g. `pricing-table`

   Check `blockSchemas` in `packages/sanity-blocks/src/sanity-blocks.ts`
   first — if the name is taken you are editing a block, not adding one.
2. **Fields** — what content editors manage. If the request doesn't say, ask.
   Reuse shared field helpers from
   `packages/sanity-blocks/src/internal/schema-fields.ts`
   (`buttonsField`, `definePortableTextField`, etc.) before defining new shapes.
3. **An icon** — every existing block schema imports one from `lucide-react`;
   `@sanity/icons` also works, but match the neighbours. Whichever you pick,
   add a matching stub to
   `packages/sanity-blocks/src/internal/testing/lucide-react.mock.tsx` —
   `lucide-mock-coverage.test.ts` fails the whole suite on any icon imported
   under `src/` that has no stub, and an unstubbed icon renders as `undefined`
   ("Element type is invalid") in every component test.

Study the closest existing block in `packages/sanity-blocks/src/` (e.g. `cta`
for text+buttons, `showcase-grid` for card grids, `faq-accordion` for
nested arrays) and mirror its structure and idioms.

## Steps

Work through all steps in order — a block missing any registration renders as
"Component not found" on the web or blank in `.md` output.

### 1. Create the block directory

`packages/sanity-blocks/src/<kebab>/` containing:

**`<kebab>.schema.ts`** — the Sanity schema:

```ts
import { Table } from "lucide-react";
import { defineField, defineType } from "sanity";

export const pricingTableSchema = defineType({
  name: "pricingTable",
  type: "object",
  icon: Table,
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
      subtitle: "Pricing Table",
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

export const pricingTableGroqProjection = /* groq */ `
  _type == "pricingTable" => {
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
siblings, use `SanityImage` / `SanityButtons` / `RichText` / `BlockEyebrow`
from `@workspace/sanity-blocks/internal/*`, and give the `<section>` the shared
`block-section` class (`hero` and `logo-cloud` are the two that opt out, both
with their own full-bleed layout).

The hardcoded `id` is the repo-wide convention (`id="cta"`, `id="faq"`,
`id="showcase"`, …) and doubles as the in-page anchor. It assumes one instance
per page: the page builder is an unconstrained array, so an editor who adds the
same block twice gets a duplicate `id`. Keep the convention, and drop the `id`
if the block is one an editor is likely to repeat:

```tsx
import { BlockEyebrow } from "@workspace/sanity-blocks/internal/block-eyebrow";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";

export interface PricingTableProps {
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
}

export function PricingTable({
  eyebrow,
  title,
  richText,
}: Readonly<PricingTableProps>) {
  return (
    <section className="block-section" id="pricing-table">
      <div className="container">
        <BlockEyebrow eyebrow={eyebrow} />
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
`../internal/portable-text-to-markdown`.

`MarkdownBlock` in `../internal/markdown.ts` is one wide interface of optional
fields accumulated across every block, not a per-block type. If the serializer
reads a field that is not already on it (`items`, `cards`, `logos`, `socials`,
`testimonial`, …), add that field — and any row type it needs — to
`MarkdownBlock` in the same edit, or the serializer will not compile:

```ts
import {
  type MarkdownBlock,
  type MarkdownOptions,
  headingToMarkdown,
  joinSections,
} from "../internal/markdown";
import { portableTextToMarkdown } from "../internal/portable-text-to-markdown";

export function pricingTableToMarkdown(
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

**`<kebab>-markdown.test.ts`** — cover: empty block returns `""`, fields
serialize joined by blank lines, markdown chars are escaped, and **no HTML/JSX
leaks** (`expect(result).not.toMatch(/<\/?[A-Za-z]/)` — the `\/?` also catches a
stray closing tag like `</p>`, which the bare `/<[A-Za-z]/` in the existing
tests misses). Mirror `cta/cta-markdown.test.ts` for the rest.

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
pnpm --filter studio extract
pnpm type
```

Both commands are required, in that order. `pnpm type` runs
`sanity typegen generate`, which reads the **committed**
`apps/studio/schema.json` — it does not look at the schema source. Only
`sanity schema extract` refreshes that file. Run `pnpm type` alone and the
generated types silently keep the old schema, leaving
`PagebuilderType<"<camel>">` unresolvable in step 5 (never paper over that with
a cast — it means extract didn't run).

Together they update `packages/sanity/src/sanity.types.ts`; the web app's
`PagebuilderType<"<camel>">` in `apps/web/src/types.ts` picks the new block up
automatically — never hand-write Sanity shapes.

### 5. Register the web renderer

In `apps/web/src/components/pagebuilder.tsx`: import the component from
`@workspace/sanity-blocks/<kebab>/index` and add a `case` to
`renderBlockComponent`:

```tsx
case "pricingTable":
  return <PricingTable {...(block as PagebuilderType<"pricingTable">)} />;
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
`pnpm --filter studio sync-thumbnails`. Generate one if you have a thumbnail
skill available (this repo ships none), or note in the PR that the thumbnail is
pending — the block works without it; the menu tile just has no preview image.

### 8. Verify

```bash
pnpm --filter @workspace/sanity-blocks test   # component + markdown tests
pnpm check-types
pnpm format                                   # Biome, auto-fix
pnpm lint
```

`check-types` does **not** catch a missing registration. Both switches —
`renderBlockComponent` and `blockToMarkdown` — end in a `default` arm with no
`never` exhaustiveness guard, so a missing `case` type-checks clean and only
shows up at runtime as the "Component not found for block type" placeholder, or
as a blank section in `.md` output. Grep for the two `case` arms instead:

```bash
grep -rn 'case "<camel>":' apps/web/src/components/pagebuilder.tsx \
  packages/sanity-blocks/src/internal/page-builder-to-markdown.ts
```

One hit per file. Fewer means a registration is missing.

## Checklist

- [ ] `packages/sanity-blocks/src/<kebab>/` — schema, groq, index.tsx, markdown.ts, two test files
- [ ] Every schema field has a `description`
- [ ] Schema icon stubbed in `internal/testing/lucide-react.mock.tsx`
- [ ] Exported + appended to `blockSchemas` in `sanity-blocks.ts`
- [ ] Projection added to `pageBuilderFragment` in `packages/sanity/src/query.ts`
- [ ] `pnpm --filter studio extract` **then** `pnpm type` — types include the block
- [ ] `case` added in `renderBlockComponent` (`apps/web/src/components/pagebuilder.tsx`)
- [ ] `case` added in `blockToMarkdown` (`internal/page-builder-to-markdown.ts`)
- [ ] Any new field the serializer reads added to `MarkdownBlock`
- [ ] Thumbnail added or flagged as pending
- [ ] Both `case` arms grepped for — `check-types` will not flag a missing one
- [ ] Tests, `check-types`, and lint pass
