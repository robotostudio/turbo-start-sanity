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
| `NEXT_PUBLIC_SANITY_API_VERSION` | yes | Pre-filled with a valid date |
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
| `SANITY_STUDIO_API_VERSION` | no | Defaults to `2025-05-08` |
| `SANITY_STUDIO_PRESENTATION_URL` | non-dev | The deployed web URL. Only `NODE_ENV=development` gets the `http://localhost:3000` default; anything else (production, `test`, unset) throws when this is missing |
| `SANITY_STUDIO_APP_ID` | no | Empty until your first `sanity deploy` returns one — see [Deploying](#sanity-studio) |
| `NEXT_PUBLIC_SITE_URL` | no | Used by the `invalidate-tags` Sanity Function, not by the Studio UI |
| `SANITY_REVALIDATE_SECRET` | no | Same — must match the web app's value for cache invalidation to work |

Notes:

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
GROQ projection, React component, Markdown serializer, and insert-menu
thumbnail.

After schema changes, regenerate types with:

```sh
pnpm type
```

Generated types land in `packages/sanity/src/sanity.types.ts`; the frontend
derives every content type from that file rather than redeclaring shapes. See
[CLAUDE.md](CLAUDE.md) for the architecture in detail, including the checklist
for adding a new page-builder block.

## Notable features

- Page-builder architecture backed by shared block schemas and renderers
- Sanity Visual Editing / Presentation integration
- Blog index and blog post routes
- Redirect support managed in Sanity
- Markdown twins for pages via `.md` URLs and `Accept: text/markdown`
- `llms.txt` generation at `/llms.txt`
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
