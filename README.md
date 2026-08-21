# Turbo Start Sanity

Turbo Start Sanity is an open-source Sanity template built as a `pnpm`
monorepo with Turborepo, a Next.js 16 frontend, and a Sanity Studio 6
workspace.

It is designed for teams that want a production-ready page-builder starter with
visual editing, shared packages, and a clear split between the web app and the
CMS.

![Turbo Start Sanity](https://raw.githubusercontent.com/robotostudio/turbo-start-sanity/main/assets/og-image.png)

## What is included

- `apps/web`: Next.js 16 App Router frontend with React 19, Tailwind CSS v4,
  Visual Editing, SEO routes, and Playwright smoke tests
- `apps/studio`: Sanity Studio 6 workspace with page, blog, FAQ, redirect, and
  singleton schemas
- `packages/sanity-blocks`: shared page-builder block schemas, GROQ fragments,
  React renderers, Markdown serializers, and tests
- `packages/sanity`: shared Sanity client, live query helpers, GROQ queries,
  the `urlFor` image URL helper, and the generated Sanity types
- `packages/ui`, `packages/tailwind-config`, `packages/env`,
  `packages/logger`, `packages/typescript-config`: shared workspace packages for
  UI, styling, env validation, logging, and TypeScript config

## Repo layout

```txt
apps/
  studio/   Sanity Studio
  web/      Next.js frontend
packages/
  env/
  logger/
  sanity/
  sanity-blocks/
  tailwind-config/
  typescript-config/
  ui/
```

## Requirements

- Node.js `>=22.12`
- pnpm `10.32.1` — pinned via `packageManager`, so the simplest setup is
  `corepack enable` and letting Corepack install the right version
- A free [Sanity](https://www.sanity.io/) account

## Getting started

There is no zero-config run: the web app validates its environment (and reads
redirects from Sanity) at startup, so you need a Sanity project and API tokens
before `pnpm dev` will boot. Steps 1–5 below take about five minutes.

### 1. Get the code

Either scaffold a fresh project — this also creates a Sanity project and fills
in the Studio env for you:

```sh
npm create sanity@latest -- --template robotostudio/turbo-start-sanity
```

…or clone the repository directly:

```sh
git clone https://github.com/robotostudio/turbo-start-sanity.git
cd turbo-start-sanity
corepack enable
pnpm install
```

### 2. Create a Sanity project

If you used `npm create sanity@latest` above, the project already exists — skip
to step 3 below. Steps 3–5 are still required either way: the scaffold does not
create API tokens or CORS origins, and the web app will not boot without them.

1. Go to [sanity.io/manage](https://www.sanity.io/manage) and create a project.
2. Note the **Project ID** and the **dataset** name (`production` by default).
3. Under **API > Tokens**, create a token with the **Viewer** role. This is your
   `SANITY_API_READ_TOKEN`, used for drafts, live preview, and Visual Editing.
4. Create a second token with the **Editor** role for `SANITY_API_WRITE_TOKEN`.
5. Under **API > CORS origins**, add `http://localhost:3000` with
   **Allow credentials** enabled.

### 3. Configure environment variables

Copy the example env files:

```sh
cp apps/web/.env.example apps/web/.env
cp apps/studio/.env.example apps/studio/.env
```

`apps/web/.env` — validated by `@workspace/env`, so the app refuses to start if
a required value is missing:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | From sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | no | Defaults to today's UTC date if unset |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | yes | `http://localhost:3333` locally |
| `SANITY_API_READ_TOKEN` | yes | Viewer token — drafts, live preview, Visual Editing |
| `SANITY_API_WRITE_TOKEN` | yes | Editor token. Validation requires it even though no runtime code reads it yet, so it must be set for `pnpm dev` and `pnpm build` to start |
| `SANITY_REVALIDATE_SECRET` | no | Shared secret for the `/api/revalidate-sync-tags` webhook. The route rejects all requests while unset |

`apps/studio/.env` — read via plain `process.env`, no schema validation:

| Variable | Required | Notes |
| --- | --- | --- |
| `SANITY_STUDIO_PROJECT_ID` | yes | Same project ID as the web app |
| `SANITY_STUDIO_DATASET` | yes | Same dataset as the web app |
| `SANITY_STUDIO_TITLE` | no | Studio display name |
| `SANITY_STUDIO_API_VERSION` | no | Defaults to today's UTC date if unset |
| `SANITY_STUDIO_PRESENTATION_URL` | non-dev | The deployed web URL. Only `NODE_ENV=development` gets the `http://localhost:3000` default; anything else (production, `test`, unset) throws when this is missing |
| `SANITY_STUDIO_APP_ID` | no | Empty until your first `sanity deploy` returns one — see [Deploying](#sanity-studio) |
| `NEXT_PUBLIC_SITE_URL` | no | Used by the `invalidate-tags` Sanity Function, not by the Studio UI |
| `SANITY_REVALIDATE_SECRET` | no | Same — must match the web app's value for cache invalidation to work |

Notes:

- Video is hosted on **Mux**, not stored in Sanity. There is no env var for it:
  the first time an editor uploads a video, the Studio asks for a Mux Access
  Token ID and Secret Key, and stores both in the dataset as `secrets.mux`.
  Give that token only the Mux Video read and write scopes — on a public dataset it is readable by anyone who can
  query the dataset. Nothing else in the template needs a Mux account until
  then.
- Local development defaults are `http://localhost:3000` for the web app and
  `http://localhost:3333` for Studio.
- On Vercel, framework environment variables such as
  `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` are auto-injected and used for
  absolute URLs in features like `llms.txt` and Markdown output.
- The `.env.example` files inside `packages/*` exist for template validation.
  Only `apps/web` and `apps/studio` need env files to run the project.

### 4. Load the sample content

The template ships with seed data so the site is not blank on first run
(`pnpm install` prints this reminder too):

```sh
cd apps/studio
npx sanity dataset import seed-data.tar.gz production --replace
```

Replace `production` with your dataset name if it differs. `--replace`
overwrites documents that already have the same `_id`.

### 5. Start the apps

```sh
pnpm dev
```

Then open:

- Web: `http://localhost:3000`
- Studio: `http://localhost:3333`

## Useful commands

```sh
pnpm dev              # Run all dev tasks through Turbo
pnpm dev:web          # Next.js only
pnpm dev:studio       # Sanity Studio only

pnpm build            # Build all packages
pnpm build:web        # Build the web app
pnpm build:studio     # Build Studio

pnpm lint             # Biome lint across the workspace
pnpm format           # Biome format across the workspace
pnpm format:check     # Check formatting without writing
pnpm check-types      # TypeScript checks across the workspace
pnpm type             # Run Sanity type generation tasks

pnpm test             # Vitest unit tests (packages/sanity-blocks)
pnpm test:e2e         # Playwright smoke tests against a running or deployed site
```

## Content model

The Studio currently includes these document types:

- Singletons: `homePage`, `blogIndex`, `settings`, `footer`, `navbar`
- Documents: `blog`, `page`, `faq`, `author`, `redirect`

The document definitions live in
`apps/studio/schemaTypes/documents`, and the shared page-builder blocks live in
`packages/sanity-blocks/src` — one directory per block, each holding its schema,
GROQ projection, React component, Markdown serializer, and its insert-menu
thumbnail.

After schema changes, regenerate types with:

```sh
pnpm type
```

Generated types land in `packages/sanity/src/sanity.types.ts`; the frontend
derives every content type from that file rather than redeclaring shapes. See
[CLAUDE.md](CLAUDE.md) for the architecture in detail, including the checklist
for adding a new page-builder block.

## Documenting your routes

The Studio tells editors what fields exist, not what any document *does* or which
URL it ends up at. [`sanity-plugin-md-notes`](https://www.npmjs.com/package/sanity-plugin-md-notes)
fixes that: drop a `<schemaName>.help.md` next to a schema and editors get a Help
panel inside the Studio, rendered from your markdown.

Rather than ship help files that won't match your content model, paste the prompt
below into Claude Code (or your agent of choice). It installs the plugin, works out
what routes your site actually has by reading your schemas and querying your
dataset, and writes the documentation against your content.

```
Document every route in this project.

This repo is Turbo Start Sanity: a pnpm/Turborepo monorepo with a Vite-based Sanity
Studio in `apps/studio` and a Next.js frontend in `apps/web`. You're going to install
`sanity-plugin-md-notes`, which turns a `<schemaName>.help.md` file sitting next to a
schema into a Help panel inside the Studio, and then write those files for every route
this site has.

1. Install and register the plugin

Read the plugin README and follow its Vite setup, not the Turbopack/codegen one -
this Studio runs on `sanity dev`. npmjs.com returns 403 to programmatic fetches, so
pull the README from the registry instead:
`curl -s https://registry.npmjs.org/sanity-plugin-md-notes | jq -r .readme`

Document the four URL-owning types at minimum (`homePage`, `page`, `blogIndex`,
`blog`) plus `redirect`. The global config types (`navbar`, `footer`, `settings`)
and reference-only types (`author`, `faq`) are optional - say which you chose.

You need three things:

- `helpPlugin({ files })` in the `plugins` array of `apps/studio/sanity.config.ts`,
  with `files` from `import.meta.glob("./schemaTypes/**/*.help.md", { eager: true,
  query: "?raw", import: "default" })`
- `defaultDocumentNode: withHelpDefaultDocumentNode()` on the existing
  `structureTool(...)` call
- `withHelp()` wrapped around each document schema you intend to document

One thing will bite you. `apps/studio/tsconfig.json` sets `"types": []`, so
`import.meta.glob` won't typecheck and the build fails with `Property 'glob' does
not exist on type 'ImportMeta'`. Add `"vite/client"`.

Leave the page-builder block schemas in `packages/sanity-blocks` alone. `apps/web`
imports that package, and `withHelp` would pull a Studio-only dependency into the
frontend's dependency graph. Document types only.

2. Work out what the routes actually are

Don't infer routes from the files in `apps/web/src/app`. Only a handful are static.
The real inventory is the home page, every `page` document's slug, the blog index,
and every `blog` document's slug. Work it out from the content, not the filesystem:

a. List the document types in `apps/studio/schemaTypes/documents/`. Mark which own a
   URL, which are global config consumed by the layout (navbar, footer, settings),
   and which are only ever referenced by other documents (author, faq).
b. For each URL-owning type, read its route file in `apps/web/src/app`, the GROQ
   query in `packages/sanity/src/query.ts` that feeds it, and its entry in
   `apps/studio/utils/slug-validation.ts`. Note the exact query names and paths.
   You'll cite them.
c. Query the dataset for the live slugs of each type, so you document real URLs
   rather than hypothetical ones. `apps/web/src/app/llms.txt/route.ts` already does
   this exact enumeration. Read it first. If no dataset is configured, fall back to
   the seed data in `apps/studio/seed-data.tar.gz`.
d. Trace everything downstream of each type: `sitemap.ts`, `llms.txt`, the `.md` twin
   rewrite in `apps/web/src/proxy.ts`, build-time redirects in
   `apps/web/next.config.ts`, and the Presentation mapping in
   `apps/studio/location.ts`.
e. Collect the rules an editor can trip over: reserved slug prefixes, required exact
   slugs, uniqueness constraints, and anything that fires automatically on publish
   (this template mints a `redirect` document whenever a published slug changes).

Write the inventory out as a table before you start writing help files, so it can be
checked against what you produce.

3. Write the help files

One `<schemaName>.help.md` per wrapped schema, in `apps/studio/schemaTypes/documents/`.
The glob root is `schemaTypes/` - files anywhere else produce an empty map and no
error.

The filename must equal the schema's `name:` exactly, because the plugin keys its
registry on the basename. `blog-index.ts` declares `name: "blogIndex"`, so it needs
`blogIndex.help.md`. A mismatch fails silently: the Help icon just never appears.

This knowingly breaks the kebab-case file convention in `CLAUDE.md`. Follow the
plugin, not the convention, and add a note to `CLAUDE.md` saying why.

Write for a non-technical editor. Each file:

- `lastUpdated` frontmatter with today's date
- One sentence on what the document type is for
- The URL it produces, with a real example taken from the dataset
- A table of the slug rules
- What happens when you publish it: redirects, revalidation, anything automatic
- Where it surfaces beyond its own page (navigation, sitemap, `llms.txt`, `.md` twin)
- `> [!WARNING]` for anything destructive or irreversible, `> [!IMPORTANT]` for rules
  that will reject a save

Cross-link sibling types with in-Studio intent links. Editing an existing document is
`[Navigation](/structure/intent/edit/id=navbar;type=navbar)`; creating a new one is
`[Redirects](/structure/intent/create/type=redirect)`. Querystring syntax crashes the
router. The format is semicolon-separated path segments and the `/structure/` prefix
is required.

4. Verify

`S.document()` bypasses `defaultDocumentNode`, so every call site needs
`helpView(S, { schemaType })` spread into `.views([...])` or the tab silently never
appears. There are two files to fix, not one:

- `apps/studio/structure.ts` - the singletons. Note `blogIndex` already calls
  `.views([S.view.form()])`; extend that array rather than replacing it.
- `apps/studio/components/nested-pages-structure.ts` - three more call sites, which
  build every `page` document under "Pages by Path". Miss these and Pages, the
  most-edited type, has no Help tab on that route. Reaching a Page via "All Pages"
  goes through `S.documentTypeListItem` and does get the tab, so the bug looks fixed
  unless you check "Pages by Path" specifically.

Run `pnpm dev:studio` and open a document of each type, including a singleton and a
Page reached via "Pages by Path". Confirm the Help inspector (book icon, top right)
renders your markdown.

Finish with `pnpm check-types`, `pnpm lint` and `pnpm format:check`.
```

Wrapping schemas in `withHelp()` reindents them, so review the resulting diff with
`git diff -w`.

## Notable features

- Page-builder architecture backed by shared block schemas and renderers
- Video through Mux — one upload per clip, adaptive streaming, no format matrix
- Sanity Visual Editing / Presentation integration
- Blog index and blog post routes
- Redirect support managed in Sanity
- Markdown twins for pages via `.md` URLs and `Accept: text/markdown`
- `llms.txt` generation at `/llms.txt`
- Copy-paste prompt for documenting your routes inside the Studio
- GitHub Actions for CI, template validation, E2E smoke tests, and Studio deploy

## Deploying

### Web app

The frontend is intended to be deployed from `apps/web`.

For Vercel:

1. Create a new project from this repository.
2. Set the Root Directory to `apps/web`.
3. Add the web environment variables from `apps/web/.env.example`.
4. Add your production domain to Sanity CORS origins.

### Sanity Studio

Studio can be deployed locally from `apps/studio`:

```sh
cd apps/studio
pnpm run deploy
```

Use `pnpm run deploy`, not `pnpm deploy` — the latter is pnpm's own built-in
command and will not run this script.

The first Studio deploy must be done locally so Sanity can create the hosted
Studio app and return an app ID. Save that value as `SANITY_STUDIO_APP_ID` for
future deploys.

This repository also includes a manual GitHub Actions workflow at
`.github/workflows/deploy-sanity.yml`. It is triggered with
`workflow_dispatch`, not automatically on every push.

To use that workflow, configure these GitHub repository secrets:

- `SANITY_DEPLOY_TOKEN`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`
- `SANITY_STUDIO_TITLE`
- `SANITY_STUDIO_PRESENTATION_URL`
- `SANITY_STUDIO_APP_ID`

### Configure Sanity CORS origins

Add your web app URLs in Sanity Manage under **API > CORS origins**:

- your production URL
- your custom domain, if you use one
- `http://localhost:3000` for local development

Enable credentials for origins that need authenticated preview or visual
editing requests.

## Troubleshooting

**`pnpm dev` exits immediately with an env validation error.** `apps/web` reads
`@workspace/env` from `next.config.ts`, so every required variable in the table
above must be present before the dev server starts — including
`SANITY_API_WRITE_TOKEN`.

**The web app starts but every page 404s or the site looks empty.** The dataset
has no content yet. Run the seed import in step 4, or publish a `homePage`
document in the Studio.

**Studio loads but Presentation shows a blank or blocked preview.** Add
`http://localhost:3000` to **API > CORS origins** in sanity.io/manage with
credentials allowed.

**`sanity deploy` asks for a Studio host every time.** Copy the app ID returned
by the first deploy into `SANITY_STUDIO_APP_ID`.

**Wrong pnpm version.** Run `corepack enable`; the repo pins pnpm through the
`packageManager` field.

## Contributing

Bug reports and pull requests are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the checks CI runs, and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security issues should be reported
privately as described in [SECURITY.md](SECURITY.md).

## Workflows

The repository currently ships with:

- `.github/workflows/ci.yml`: lint, format check, type check, and unit tests on
  push/PR to `main`
- `.github/workflows/e2e.yml`: Playwright smoke tests on successful deployment
  status events
- `.github/workflows/deploy-sanity.yml`: manual Studio deploy workflow
- `.github/workflows/sanity-template.yml`: Sanity template validation on `main`

## License

[MIT](LICENSE)
