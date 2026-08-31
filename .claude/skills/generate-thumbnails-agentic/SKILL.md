---
name: generate-thumbnails-agentic
description: Use when regenerating Sanity Studio page builder insert-menu thumbnails — screenshots every block from a temporary preview page and writes each block's thumbnail.png. Use when the user says "generate thumbnails", "regenerate the block thumbnails", or after a rebrand/theme change makes the existing tiles wrong. For a single new block, the new-block skill's step 7 points here.
---

# Generate Page Builder Thumbnails

## Overview

The Studio insert menu shows a grid of block previews. This skill regenerates
that whole set: render every block on a throwaway page, screenshot each one,
and write the result to each block's `thumbnail.png`.

Read `CLAUDE.md` → "Page Builder Pattern" first — the paths below are
load-bearing.

## How thumbnails actually work here

The source of truth is **one `thumbnail.png` per block, co-located with it**:

```txt
packages/sanity-blocks/src/<kebab-block>/thumbnail.png   ← write this
                    ↓  pnpm --filter studio sync-thumbnails  (also runs on postinstall)
apps/studio/static/thumbnails/preview-<kebab-block>.png  ← generated, do not edit
```

`packages/sanity-blocks/scripts/sync-thumbnails.ts` **deletes every
`preview-*.png` in the target directory** and re-copies from the block folders.
Anything you hand-write into `apps/studio/static/thumbnails/` is gone at the next
install.

<HARD-GATE>
Write PNGs to `packages/sanity-blocks/src/<block>/thumbnail.png`. Never write
into `apps/studio/static/thumbnails/` — that directory is generated.
</HARD-GATE>

Format is fixed by `previewImageUrl` in
`apps/studio/schemaTypes/definitions/pagebuilder.ts`, which camelCase→kebab-cases
the schema name and appends `.png`:

- **PNG**, not WebP — a `.webp` file 404s and the tile renders empty
- **1200×800**, matching every existing thumbnail
- filename is the **block's directory name** (kebab-case: `feature-cards-icon`),
  not the schema type name (`featureCardsIcon`)

## Prerequisites

1. **Playwright MCP is configured.** Run a Playwright MCP tool (e.g.
   `browser_navigate`) to verify. It is **not** committed to this repo, so a
   fresh clone will not have it. If unavailable, **STOP** and ask the user:

   > "This skill drives the browser through the Playwright MCP server. Please
   > run this and restart Claude Code:"
   >
   > ```
   > claude mcp add playwright -- npx @playwright/mcp@latest
   > ```

   Do NOT proceed until the user confirms it is available.

2. **Image tooling.** `ffmpeg` or `sharp` for the resize. Check first:
   `command -v ffmpeg`.

3. **The dev server is running** on :3000. Check with
   `curl -sI localhost:3000`. If it isn't, ask before starting `pnpm dev:web` —
   don't auto-launch.

4. **Sanity credentials**, to look at dataset images:
   `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` and
   `SANITY_API_READ_TOKEN` from `apps/web/.env.local` (or `.env`).

## Step 1: Discover the blocks

The block list is `blockSchemas` in
`packages/sanity-blocks/src/sanity-blocks.ts` — ten at the time of writing. Each
entry maps to a directory `packages/sanity-blocks/src/<kebab>/` containing
`<kebab>.schema.ts`, `<kebab>.groq.ts`, `index.tsx`, and `thumbnail.png`.

For each block, record:

- the **directory name** (this is the output filename)
- the schema `name` (matches the block folder once kebab-cased)
- which fields are images or video, from `<kebab>.schema.ts`

## Step 2: Read the components and their GROQ

The render layer is `packages/sanity-blocks/src/<kebab>/index.tsx`, imported by
`apps/web/src/components/pagebuilder.tsx`. Read the props of each.

<HARD-GATE>
**Blocks here take GROQ-projected data, not raw Sanity field values.** The mock
data must match the projection in `<kebab>.groq.ts`, not the schema.

Images are the trap. Components take `SanityImageData` from
`internal/sanity-image`, which is what `imageFields` in
`internal/groq-fragments.ts` projects:

```typescript
image: {
  id: "image-<hash>-1200x800-jpg",   // asset._ref, flattened to a string
  alt: "Placeholder image",
  preview: null,                      // lqip, optional
  hotspot: null,
  crop: null,
}
```

A raw `{ _type: "image", asset: { _type: "reference", _ref } }` renders
**nothing** — `resolveAssetId` rejects it. Same for video: read the
`muxVideoFields` fragment, don't invent the shape.
</HARD-GATE>

## Step 3: Get image asset ids

Blocks with image fields need a real asset id or they screenshot blank.

**3a. Use what's already in the dataset.** Query it:

```bash
set -a; source apps/web/.env.local; set +a
PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID
DATASET=$NEXT_PUBLIC_SANITY_DATASET

curl -s -G "https://$PROJECT_ID.api.sanity.io/v2024-01-01/data/query/$DATASET" \
  -H "Authorization: Bearer $SANITY_API_READ_TOKEN" \
  --data-urlencode 'query=*[_type == "sanity.imageAsset"][0...20]{ _id, originalFilename, metadata { dimensions } }'
```

Ask for 10–20, not 5 — you want options.

<HARD-GATE>
**Look at the candidates before picking.** The first landscape asset in a dataset
is often a partner or competitor logo, or a branded marketing graphic. Pick it
blind and that logo ends up across every hero tile in Studio. (This has
happened.)

```bash
# extension must match the _id suffix, or the CDN returns a JSON error
curl -s -o /tmp/preview-{hash}.{ext} \
  "https://cdn.sanity.io/images/$PROJECT_ID/$DATASET/{hash}-{w}x{h}.{ext}?w=400"
```

`Read` each file to actually see it. Reject anything carrying a third-party mark.
</HARD-GATE>

Pick 5–8 varied subjects and spread them across blocks deliberately — one image
repeated down the whole grid is a red flag. `apps/web/public/` is worth a look
too for intended background textures.

**3b. Only if the dataset has none**, upload placeholders — and **ask first**,
it writes to their dataset:

```bash
curl -L -o /tmp/placeholder-landscape.jpg "https://picsum.photos/seed/thumb-land/1600/1200"

curl -s -X POST "https://$PROJECT_ID.api.sanity.io/v2024-01-01/assets/images/$DATASET" \
  -H "Authorization: Bearer $SANITY_API_WRITE_TOKEN" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/tmp/placeholder-landscape.jpg
```

The response's `_id` (`image-<hash>-1600x1200-jpg`) is what goes in `id`. Offer
to delete them in Step 7.

## Step 4: Build the preview page

Create `apps/web/src/app/thumbnails/page.tsx`, importing block components
directly from `@workspace/sanity-blocks/<kebab>/index` — not through
`PageBuilder`, which needs Visual Editing context.

<HARD-GATE>
Mark it `"use client"`. Several blocks pass function props to client libraries
(`DynamicIcon` fallbacks, Radix primitives, `useFormStatus`) which cannot cross
the RSC boundary — a server component throws "Functions cannot be passed
directly to Client Components".
</HARD-GATE>

Wrap each block so the screenshot step can find it. Use the **directory name**,
since that's the output filename:

```tsx
<div data-block="feature-cards-icon">
  <FeatureCardsWithIcon {...mock} />
</div>
```

Mock data rules:

- **Contextual copy**, not lorem ipsum — a hero gets a real headline, a FAQ gets
  plausible questions. These are what editors browse.
- **Rich text** is Portable Text, never a plain string:
  `[{ _type: "block", _key: "k1", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s1", text: "…", marks: [] }] }]`
- **Images** use the flattened shape from Step 2's gate.
- **Every array item** needs a unique `_key`. It does **not** need `_type` —
  these components take plain typed interfaces (`FeatureCard`, `LogoCloudLogo`,
  `ShowcaseGridItem`), not discriminated unions. `FaqItem` is the one that wants
  an `_id` instead. Read the interface; don't assume.
- **Video blocks**: pass a `playbackId` for a public Mux asset, or accept that
  the block renders its copy with no video (both `video-feature` and `hero`
  handle a missing video deliberately — see CLAUDE.md → Video).
- `as any` / `@ts-expect-error` is fine here; the page is deleted in Step 7.
- Don't put a background colour on the wrappers — it adds noise to every tile.

## Step 5: Screenshot each block

Use the Playwright MCP tools in sequence:

1. **Set the viewport** — `browser_resize` to **1440×900**.
2. **Navigate** — `browser_navigate` to `http://localhost:3000/thumbnails`.
3. **Wait for render** — let the network settle before touching anything.

<HARD-GATE>
**Pin the colour scheme; never inherit the browser's default.** A fresh
Playwright Chromium has no dark preference, so this site renders **light**,
while a normal dev session renders dark. The captures and the padding in Step 6
must agree, and the tiles should match what editors see in Studio. Choose one
and set it explicitly (`browser_emulate_media` with `colorScheme`, or an
`prefers-color-scheme` override), then pad to match in Step 6.
</HARD-GATE>

<HARD-GATE>
**Hide the layout chrome before capturing.** `apps/web/src/app/layout.tsx` wraps
this page in the real site, and its `header` is `position: sticky; z-index: 40`.

Easy to miss, because it only affects some blocks: one *shorter* than the
viewport captures clean, since the header sits outside the element bounds. One
*taller* is stitched by scrolling, so the header rides along and bakes in
**across the middle of the image** — `cta` at 765px was clean, `showcase-grid`
at 1402px had the navbar through the centre.

Inject once after navigating, and again after any reload:

```js
browser_evaluate: () => {
  const s = document.createElement("style");
  s.textContent = "header,footer,nextjs-portal{display:none !important}";
  document.head.appendChild(s);
}
```

The `footer` (~690px) and the Next dev indicator (`nextjs-portal`) go the same
way.
</HARD-GATE>

Then, for each block:

- scroll `[data-block="<kebab>"]` into view (this is also what loads its images —
  they are `loading="lazy"`)
- wait for that block's images to actually decode, rather than guessing a delay:

  ```js
  browser_evaluate: (sel) =>
    [...document.querySelectorAll(`${sel} img`)]
      .every((i) => i.complete && i.naturalWidth > 0)
  ```

  Poll it, and stop with an error if it hasn't settled in a few seconds — a
  block that never loads should fail loudly, not screenshot blank.
- `browser_take_screenshot` of **that element**, saved as
  `/tmp/thumbnails/<kebab>-raw.png`

**Sanity-check the captures before processing.** A mean-luminance read spots an
empty one faster than opening ten files:

```bash
for f in /tmp/thumbnails/*-raw.png; do
  printf "%-24s %s\n" "$(basename "$f" -raw.png)" \
    "$(ffmpeg -hide_banner -i "$f" -vf signalstats,metadata=print:key=lavfi.signalstats.YAVG \
       -f null - 2>&1 | grep -o 'YAVG=[0-9.]*' | head -1)"
done
```

A capture sitting at the bare background value — ~19 dark, ~230 light — is
empty. Look at any that do before processing.

## Step 6: Process and place

Target: **1200×800 PNG**, full block width preserved.

<HARD-GATE>
Do not `fit: 'cover'` or centre-crop. Blocks render 1440px wide; a cover-crop
zooms in and clips the sides, cutting off titles and dropping cards. Scale width
to 1200 first, then crop height from the top, padding if short.
</HARD-GATE>

**Pad with the background of the theme you captured in** — `white` for light,
`black` for dark. Padding and capture must agree or every short block gets a
band across it. Read it rather than assuming:
`browser_evaluate: () => getComputedStyle(document.body).backgroundColor`.

```bash
PAD=white     # must match the colour scheme pinned in Step 5
for f in /tmp/thumbnails/*-raw.png; do
  name=$(basename "$f" -raw.png)
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale=1200:-1:flags=lanczos,crop=1200:min(ih\,800):0:0,pad=1200:800:0:(oh-ih)/2:$PAD" \
    "packages/sanity-blocks/src/${name}/thumbnail.png"
done
```

Two shapes need checking afterwards:

- **Blocks much taller than 3:2** (`showcase-grid`, `video-feature`, `hero` run
  1000–1400px) lose their lower half to the crop — the hero's headline can end
  mid-word. Usually fine; the tile only has to be recognisable.
- **Thin strips** (`logo-cloud` is ~72px) become a band floating in padding.
  Centre the pad instead of cropping from the top.

sharp equivalent, if ffmpeg isn't around:

```bash
node -e "
const sharp = require('sharp');
const PAD = process.env.PAD || 'white';   // same value as the ffmpeg pipeline
(async () => {
  const buf = await sharp('input.png').resize(1200, null).toBuffer();
  const { height } = await sharp(buf).metadata();
  const top = Math.floor((800 - height) / 2);
  const pipeline = height >= 800
    ? sharp(buf).extract({ left: 0, top: 0, width: 1200, height: 800 })
    : sharp(buf).extend({ top, bottom: 800 - height - top, background: PAD });
  await pipeline.png().toFile('output.png');
})();
"
```

Then sync and check the Studio menu:

```bash
pnpm --filter studio sync-thumbnails
```

There is **no schema step**. `insertMenu.views` is already wired in
`definitions/pagebuilder.ts` and derives from `blockSchemas`, so a block with a
`thumbnail.png` appears automatically. There are no `insertMenu.groups` in this
repo — don't add them unasked.

## Step 7: Clean up

```bash
rm -rf apps/web/src/app/thumbnails/   # the preview page — dead code, regenerate when needed
rm -rf /tmp/thumbnails/               # raw screenshots
rm -rf .playwright-mcp/               # only if a browser tool created it
```

If you uploaded placeholders in 3b, ask whether to delete them from the dataset.
If you used existing assets, nothing to undo.

Leave behind only the modified `packages/sanity-blocks/src/*/thumbnail.png`
files and their synced copies under `apps/studio/static/thumbnails/`.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| **Writing to `apps/studio/static/thumbnails/`** | **Generated dir — `sync-thumbnails` wipes it. Write `packages/sanity-blocks/src/<block>/thumbnail.png`** |
| **WebP output** | **`previewImageUrl` builds a `.png` path — WebP 404s and the tile is blank** |
| **camelCase filename** | **Use the kebab-case directory name (`feature-cards-icon`), not the schema type (`featureCardsIcon`)** |
| **Raw image refs in mock data** | **Blocks take projected `{ id, alt, preview, hotspot, crop }` — `{ asset: { _ref } }` renders nothing** |
| **Cropping with `fit: cover`** | **Scale width to 1200 first, then crop/pad height** |
| Preview page as a server component | Must be `"use client"` — function props can't cross the RSC boundary |
| Adding `insertMenu` config | Already wired and generated from `blockSchemas` — nothing to add |
| **Letting the browser pick the colour scheme** | **A fresh Playwright Chromium renders light, a dev session renders dark — pin it, and pad to match** |
| **Layout chrome baked into tall tiles** | **The sticky `header` (z-40) stitches into the middle of any block taller than the viewport — hide `header,footer,nextjs-portal` first** |
| **Screenshotting before scrolling** | **Images are `loading="lazy"` — a block only loads its images once scrolled into view** |
| **Hardcoding the pad colour** | **Pad with the captured theme's background, or the tile gets a glaring band** |
| Missing `_key` on mock array items | `_key` is required; `_type` is not — these are plain interfaces, not discriminated unions (`FaqItem` wants `_id`) |
| Rich text as a plain string | Portable Text block format only |
| Going through `PageBuilder` | Import block components directly — `PageBuilder` needs Visual Editing context |
| Grabbing the first landscape asset | View candidates first — it's often a partner logo |
| Uploading to the dataset unasked | Check for existing assets, then ask |
| Leaving `app/thumbnails/` behind | Delete it — dead code, and this skill regenerates it |
| Generic placeholder copy | Write contextual text; editors browse these tiles |

## Red Flags — stop if you notice these

- You're about to write a `.webp`, or write anything into
  `apps/studio/static/thumbnails/` — **stop**, wrong format and wrong directory
- Your mock image is `{ asset: { _ref: … } }` — **stop**, that renders blank here
- You're adding `insertMenu` config to `pagebuilder.ts` — **stop**, it's generated
- You're about to `fit: 'cover'` — **stop**, it clips wide blocks
- The preview page has no `"use client"` — **stop**, it will crash
- Image areas are blank on a capture — **stop**, fix before processing (check you
  scrolled the block into view first; the images are lazy)
- You haven't pinned the colour scheme — **stop**, the tiles won't match Studio
- You haven't hidden `header`/`footer`/`nextjs-portal` — **stop**, the navbar bakes into tall tiles
- You're uploading to someone's dataset without asking — **stop**
