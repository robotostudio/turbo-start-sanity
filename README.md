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
- `packages/sanity`: shared Sanity client, live query helpers, image helpers,
  and GROQ queries
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
- `pnpm@10.32.1`

## Getting started

### Create a new project from the template

```sh
npm create sanity@latest -- --template robotostudio/turbo-start-sanity
```

### Install dependencies

If the template bootstrap step did not already install them:

```sh
pnpm install
```

### Configure local environment variables

Copy the example env files:

```sh
cp apps/web/.env.example apps/web/.env
cp apps/studio/.env.example apps/studio/.env
```

`apps/web/.env`:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`
- `SANITY_API_READ_TOKEN`
- `SANITY_API_WRITE_TOKEN`
- `SANITY_REVALIDATE_SECRET`

`apps/studio/.env`:

- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`
- `SANITY_STUDIO_TITLE`
- `SANITY_STUDIO_PRESENTATION_URL`
- `SANITY_STUDIO_APP_ID`
- `SANITY_STUDIO_API_VERSION`
- `NEXT_PUBLIC_SITE_URL`
- `SANITY_REVALIDATE_SECRET`

Notes:

- Local development defaults are `http://localhost:3000` for the web app and
  `http://localhost:3333` for Studio.
- On Vercel, framework environment variables such as
  `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` are auto-injected and used for
  absolute URLs in features like `llms.txt` and Markdown output.

### Start the apps

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

pnpm test:e2e         # Playwright smoke tests
```

## Content model

The Studio currently includes these document types:

- Singletons: `homePage`, `blogIndex`, `settings`, `footer`, `navbar`
- Documents: `blog`, `page`, `faq`, `author`, `redirect`

The document definitions live in
`apps/studio/schemaTypes/documents`, and the shared page-builder blocks live in
`packages/sanity-blocks/src`.

To load the included sample content:

```sh
cd apps/studio
npx sanity dataset import ./seed-data.tar.gz production --replace
```

After schema changes, regenerate types with:

```sh
pnpm type
```

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
pnpm deploy
```

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

## Workflows

The repository currently ships with:

- `.github/workflows/ci.yml`: lint, format check, and type check on push/PR to
  `main`
- `.github/workflows/e2e.yml`: Playwright smoke tests on successful deployment
  status events
- `.github/workflows/deploy-sanity.yml`: manual Studio deploy workflow
- `.github/workflows/sanity-template.yml`: Sanity template validation on `main`

## License

[MIT](LICENSE)
