# Contributing to Turbo Start Sanity

Thanks for your interest in contributing. This guide covers the setup and the
checks a pull request needs to pass.

## Local setup

Follow [Getting started](README.md#getting-started) in the README first — you
need your own Sanity project and API tokens before the apps will run. In short:

```sh
corepack enable
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/studio/.env.example apps/studio/.env
# fill in the values, then:
pnpm dev
```

Node `>=24` and the pinned pnpm version from `packageManager` are required.

## How to submit a change

1. Fork the repository and clone your fork.
2. Create a branch: `git checkout -b feature/short-description`.
3. Make your changes and commit them.
4. Push the branch to your fork: `git push origin feature/short-description`.
5. Open a pull request against `main` and fill in the template.

## Before you open a pull request

Run the same checks CI runs:

```sh
pnpm lint
pnpm format:check   # or `pnpm format` to fix
pnpm check-types
pnpm test
```

If you touched a Sanity schema, also run `pnpm type` and commit the regenerated
`packages/sanity/src/sanity.types.ts`.

## Conventions

- Formatting and linting are Biome/Ultracite, not ESLint/Prettier. Do not add
  either.
- File names are kebab-case; `.tsx` for React components, `.ts` for everything
  else.
- Use the `Logger` class from `@workspace/logger` instead of `console.*`.
- Adding a page-builder block touches several files in a fixed order — follow
  the checklist in [CLAUDE.md](CLAUDE.md#page-builder-pattern).

## Pull request guidelines

- Keep pull requests focused on a single concern.
- Add or update tests for behaviour changes. Block components and Markdown
  serializers live under `packages/sanity-blocks/src/<block>/` with their tests
  co-located.
- Update the README or CLAUDE.md when you change setup steps, commands, or
  architecture.
- Fill in the pull request template, including how you tested the change.

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it
before participating.

## Questions

Open an issue using one of the templates in `.github/ISSUE_TEMPLATE`. For
security issues, follow [SECURITY.md](SECURITY.md) instead of filing publicly.
