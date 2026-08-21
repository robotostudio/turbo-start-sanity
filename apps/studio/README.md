# Studio

The Sanity Studio v6 workspace for Turbo Start Sanity. Run it from the
repository root with `pnpm dev:studio` (or `pnpm dev` for both apps); it serves
on `http://localhost:3333`.

Setup, environment variables, and the seed-data import are documented in the
[root README](../../README.md#getting-started). This Studio needs
`SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` in `apps/studio/.env` to
start.

## Layout

```txt
schemaTypes/
  documents/       Document + singleton schemas (page, blog, settings, …)
  definitions/     Shared field objects and the pageBuilder array
components/        Custom Studio components and the nested-pages structure
functions/         Sanity Functions (auto-redirect, invalidate-tags)
utils/             Studio helpers and constants
static/            Generated block thumbnails for the insert menu
seed-data.tar.gz   Sample content
```

Page-builder block schemas do not live here — they come from
`@workspace/sanity-blocks` and are merged in `schemaTypes/index.ts`.

Video uses `sanity-plugin-mux-input`, which adds the `mux.video` field type and
a "Videos" tab to the nav. Its Mux credentials are not env vars: an editor
enters them once in the plugin's setup screen and the Studio keeps them in the
dataset, so a public dataset exposes that secret to anyone who can query it.

## Scripts

```sh
pnpm dev                # sanity dev
pnpm build              # sanity build
pnpm run deploy         # sanity deploy — note `run`; `pnpm deploy` is a pnpm builtin
pnpm type               # sanity typegen generate -> packages/sanity/src/sanity.types.ts
pnpm extract            # sanity schema extract only
pnpm sync-thumbnails    # copy block thumbnails into static/thumbnails
```

## Learn more

- [Sanity docs](https://www.sanity.io/docs)
- [Join the Sanity community](https://www.sanity.io/community/join)
