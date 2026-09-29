# Audit findings: turbo-start-sanity

Date: 2026-09-29. Branch: `claude/happy-brahmagupta-99c7k6` at `f6fbf62` (main, PR #489 merged).

## How to use this file

Each finding is a self-contained ticket: ID, title, severity, area, files, what is wrong, how it fails, suggested fix, confidence. Create one ticket per `### AUD-nnn` heading. Severity is the suggested priority. The **Quick triage table** at the end lists everything in one place.

Method: dependency audit, format and lint checks, type check, unit suite, Studio build, type-generation drift check, dead-code scan, plus seven parallel code reviews (web app, shared packages, Studio and config, security, accessibility, performance, tests and CI). Every surprising claim was re-checked against the source or CI logs before inclusion. Nothing was edited.

Counts: 9 high, 27 medium, 33 low. All green today: lint, format, types, 294 unit tests, Studio build, schema.json and generated types in sync, thumbnails in sync.

---

## HIGH

### AUD-001 Production build fails when the GitHub API rate-limits the stars fetch

- Severity: high. Area: web, build. Confidence: high (confirmed in CI log).
- Files: `apps/web/src/lib/github-stars.ts:31-49`, `apps/web/src/app/layout.tsx:140`, `apps/web/next.config.ts`
- Problem: `fetchGithubStars` is a `"use cache"` function that throws on a non-2xx response. During `next build` the unauthenticated call to `api.github.com` from a shared runner IP gets 403 (rate limit). The `try/catch` in `getGithubStars` does not save the build: Next reports the error thrown inside the cache scope as a prerender error and aborts the export.
- Evidence: e2e run 36609421574 (2026-09-29), job "Playwright Presentation Tests": `Error: GitHub stars request failed with 403 ... Export encountered an error on /blog/[slug]/page ... exiting the build.` Three of the last five e2e runs failed the same way.
- Failure scenario: any build (CI, Vercel, local) at a moment when GitHub rate-limits the builder IP fails. Renovate PRs currently cannot get a green e2e run.
- Fix: never throw inside the cached function. Return `null` on failure with a short `cacheLife` so the next request retries, or skip the fetch when `process.env.NEXT_PHASE === "phase-production-build"`, or send a `GITHUB_TOKEN` when one is set. Add a unit test for the 403 path.

### AUD-002 Seed data ships live Presentation preview secrets

- Severity: high. Area: security, studio. Confidence: high (verified: 3 `sanity.previewUrlSecret` docs in `data.ndjson`).
- Files: `apps/studio/seed-data.tar.gz` (`test-export-2026-02-12t07-15-59-850z/data.ndjson`), `apps/web/src/app/api/presentation-draft/route.ts`
- Problem: the tarball contains three `sanity.previewUrlSecret` documents with their `secret` and a Sanity `userId`. The README tells users to import it into `production`. `_updatedAt` is stamped at import, and `@sanity/preview-url-secret` accepts any secret updated within the last hour.
- Failure scenario: for about an hour after every seed import, anyone who read this public repo can hit `/api/presentation-draft?sanity-preview-secret=<secret>&sanity-preview-pathname=/`, get a draft-mode cookie, see unpublished content, and receive the Viewer read token in the browser via `browserToken` (dataset-wide read, including `secrets.mux`).
- Fix: strip `sanity.previewUrlSecret` and `sanity.previewUrlShareAccess` documents from the export, re-pack the tarball, and add a check to whatever regenerates it.

### AUD-003 Deployed invalidate-tags Function has no env vars and throws on every publish

- Severity: high. Area: studio, functions. Confidence: high on mechanism, medium that no undocumented `functions env add` is run.
- Files: `apps/studio/sanity.blueprint.ts:30-37`, `apps/studio/functions/invalidate-tags/index.ts:6-19`, `apps/studio/.env.example:7-8`, `README.md:120-121`, `CLAUDE.md`
- Problem: the blueprint passes no `env` to the function. The function reads `NEXT_PUBLIC_SITE_URL` and `SANITY_REVALIDATE_SECRET` and throws when either is missing. The runtime CLI merges `process.env` only for local `functions test/dev`. README, `.env.example`, and CLAUDE.md all imply `apps/studio/.env` is enough.
- Failure scenario: after `sanity blueprints deploy`, every publish fires the function, it throws, Sanity retries, the web cache is never invalidated, and the function log fills with retries. Nothing documented deploys the blueprint at all (`deploy-sanity.yml` only runs `sanity deploy`).
- Fix: in `sanity.blueprint.ts` (already imports `dotenv/config`) pass `env: { NEXT_PUBLIC_SITE_URL, SANITY_REVALIDATE_SECRET }` from `process.env` and throw if blank, or document `sanity functions env add`. Add a README section on deploying blueprints.

### AUD-004 Hero schema and renderer disagree on what a blank `mediaType` means

- Severity: high. Area: sanity-blocks, studio. Confidence: high (verified).
- Files: `packages/sanity-blocks/src/hero/hero.schema.ts:24-32,77`, `packages/sanity-blocks/src/hero/media-type.ts:39-46`
- Problem: the schema's `selected()` defaults an absent `mediaType` to `"mux"`. The renderer's `mediaTypeOf()` infers from content (`mux` only when a public playback id resolves, else `sanity`). The comment claims they agree. `mediaType` is also `Rule.required()` with only an `initialValue`.
- Failure scenario: a hero authored before the toggle with webm/hevc files and no Mux asset renders the files on the site, but the Studio hides the file fields, shows the Mux upload, and `checkVariant` warns "Set to Mux, but only uploaded files are here". Every pre-existing hero is a validation error until an editor opens it.
- Fix: make `selected()` mirror `mediaTypeOf()` (`type === "sanity" || type === "mux-mp4" ? type : variant?.mux?.asset ? "mux" : "sanity"`), and either drop `required()` or run the `hero-media-type` migration on every dataset.

### AUD-005 Presentation "Used on" locations keyed on a type that does not exist

- Severity: high. Area: studio. Confidence: high (verified).
- Files: `apps/studio/location.ts:22`, `apps/studio/schemaTypes/documents/home-page.ts:10`, `apps/studio/schemaTypes/documents/blog-index.ts:10`
- Problem: `location.ts` registers `home: defineLocations(...)`. The singleton type is `homePage`. `blogIndex` has no entry at all. Also `blog` locations build `href` as `` `${doc?.slug}` ``, which yields the string `"undefined"` when the slug is missing.
- Failure scenario: opening the Home Page or Blog Listing in Presentation or Structure shows no "Used on" location. The resolver silently never matches.
- Fix: rename the key to `homePage`, add a `blogIndex` entry resolving to `/blog`, and guard the `blog` href.

### AUD-006 Whole page builder is a Client Component; every block ships to the browser on every page

- Severity: high. Area: web, performance. Confidence: high.
- Files: `apps/web/src/components/pagebuilder.tsx:1-15,130`, `apps/web/src/components/blog-page-content.tsx` (pattern to copy)
- Problem: `pagebuilder.tsx` is `"use client"` (only `useOptimistic` needs it) and statically imports all 11 blocks. That drags Portable Text, `CodeBlock`, `TableBlock`, `SanityIcon` plus the lucide dynamic loader, `sanity-image`, and `createDataAttribute` into every route. All block props (portable text, LQIP strings, image objects) are serialized as client props on top of the HTML, roughly doubling the RSC payload.
- Failure scenario: a page with one CTA block still downloads and hydrates the full block library. Hydration becomes the long pole for LCP (see AUD-007).
- Fix: make `PageBuilder` a server component that renders blocks. Move the reorder logic into a small client `OptimisticBlockOrder` that takes `initialKeys` plus a `Record<_key, ReactNode>` of server-rendered blocks, mounted only in draft mode. The `BlogSearchLayout` slot composition is the template.

### AUD-007 LCP hero image is invisible until hydration

- Severity: high. Area: sanity-blocks, performance. Confidence: high.
- Files: `packages/sanity-blocks/src/internal/sanity-image.tsx:141,152`, `packages/sanity-blocks/src/hero/index.tsx:90-103`, `apps/web/src/components/blog-card.tsx:22-35`, `packages/sanity-blocks/src/hero-split/index.tsx:50-59`
- Problem: `SanityImage` always passes `preview`, so `sanity-image` renders `ImageWithPreview`: the real `<img>` is `opacity:0; position:absolute; 10px` until a React `onLoad` flips state. This applies to the eager `fetchPriority="high"` hero poster, the featured blog card, and the first hero-split image.
- Failure scenario: LCP = max(image load, hydration + all block JS from AUD-006).
- Fix: skip `preview` for `loading="eager"` or `fetchPriority="high"` images (the library then emits a plain `<img src srcSet>`), optionally `ReactDOM.preload(...)`, and keep the LQIP as a CSS background if wanted.

### AUD-008 Hero renders a hard-coded `<h1>` regardless of position, and emits it empty

- Severity: high. Area: sanity-blocks, accessibility, SEO. Confidence: high.
- Files: `packages/sanity-blocks/src/hero/index.tsx:151,158-163`, `packages/sanity-blocks/src/hero-split/index.tsx:24` (correct), `apps/web/src/app/blog/page.tsx:157-165`
- Problem: `isFirst` exists but only drives the sticky layout. A hero placed anywhere but first, two heroes on one page, or a hero in the blog index page builder (rendered under `BlogHeader`'s `<h1>`) yields multiple `<h1>`s. The `<h1>` is also emitted when `title` is null (`<h1></h1>`). `HeroSplit` already does both correctly.
- Fix: `const Heading = isFirst ? "h1" : "h2"` and guard on `title`. Same empty-heading guard for `cta/index.tsx:61-67`.

### AUD-009 CI never runs the web build or a type-generation drift check

- Severity: high. Area: CI. Confidence: high.
- Files: `.github/workflows/ci.yml:61`, `.github/renovate.json:6` (automerge), `apps/studio/schema.json`, `packages/sanity/src/sanity.types.ts`
- Problem: `ci.yml` defers `next build` to Vercel. Combined with Renovate automerge, a dependency bump that breaks `next build` or `redirects()` in `next.config.ts` can merge green. It could not be confirmed that the Vercel check is a required status check (rulesets are empty, branch is protected). Nothing enforces that `schema.json` and `sanity.types.ts` are regenerated after schema changes, which CLAUDE.md itself warns "silently never reaches the generated types". Thumbnail sync is likewise unchecked (`--ignore-scripts` skips the postinstall).
- Fix: add a CI job that runs `pnpm turbo run build --filter=web` with placeholder env (needs non-empty `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN`), plus `pnpm --filter studio extract && pnpm type && pnpm --filter studio sync-thumbnails && git diff --exit-code -- apps/studio/schema.json packages/sanity/src/sanity.types.ts apps/studio/static/thumbnails`. Or mark the Vercel deployment check required.

---

## MEDIUM

### AUD-010 No security headers on the site

- Severity: medium. Area: web, security. Confidence: high.
- Files: `apps/web/next.config.ts:10-39`
- Problem: no `headers()` at all. No `Content-Security-Policy` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. HSTS comes only from Vercel. `X-Frame-Options: DENY` is not an option because Presentation iframes the site, but `frame-ancestors` is.
- Failure scenario: any origin can iframe the site (clickjacking of the newsletter form or ask box). next-sanity sets draft cookies `SameSite=None; Secure` in production, so an editor's draft session renders inside an attacker's frame.
- Fix: add `headers()` with `Content-Security-Policy: frame-ancestors 'self' ${env.NEXT_PUBLIC_SANITY_STUDIO_URL}`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy`, and HSTS for non-Vercel hosts.

### AUD-011 `/api/ask` can be abused to drain the AI budget

- Severity: medium. Area: web, security, cost. Confidence: high.
- Files: `apps/web/src/app/api/ask/route.ts:18-19,32-44,71-85,113-140`
- Problem: rate limit is an in-memory `Map` (per lambda instance, so it multiplies with concurrency), keyed on `x-forwarded-for` `.at(-1)` (fine on Vercel, spoofable self-hosted). No `Origin` or `Sec-Fetch-Site` check. `req.json()` accepts any content type, so a `mode: "no-cors"` POST from any third-party page is a CORS-simple request that runs the full pipeline: `claude-opus-5`, up to 10 MCP tool calls, 8000 output tokens. Every tool the Sanity Context MCP server offers is exposed unfiltered.
- Failure scenario: a hostile page makes every visitor fire 5 asks per minute, or one script rotates IPs. The gateway budget drains and the FAQ ask row returns 503 for everyone.
- Fix: reject unless `Sec-Fetch-Site` is `same-origin`/`same-site` (or `Origin` matches `getBaseUrl()`), require `Content-Type: application/json`, use a global limiter (Vercel Firewall rule or KV-backed), allowlist tool names, and cache the MCP tool list with a TTL.

### AUD-012 `secrets.mux` on a public dataset exposes Mux API credentials

- Severity: medium (conditional on dataset ACL). Area: studio, security. Confidence: high on mechanism.
- Files: `README.md:125-129`, `apps/studio/README.md:29-31`, `apps/studio/sanity.config.ts:67`, `apps/studio/scripts/cli-alert-for-data.ts:39`
- Problem: `sanity init` creates public datasets by default and the seed instructions target `production`. The Mux plugin stores the token ID and secret key in the dataset as `secrets.mux`. The project ID is in the client bundle.
- Failure scenario: anyone runs an unauthenticated GROQ query for `*[_id=="secrets.mux"]` against the public dataset and gets full Mux API credentials (delete or upload assets, incur billing).
- Fix: make "dataset must be private" a hard setup requirement, add a setup check of the dataset ACL, scope the Mux token to the minimum, and consider an env-based credential path instead of dataset storage. Related: `visionTool()` is unconditional in `sanity.config.ts:58`; gate it to development.

### AUD-013 Newsletter form posts to nowhere

- Severity: medium. Area: sanity-blocks, web. Confidence: high.
- Files: `packages/sanity-blocks/src/subscribe-newsletter/index.tsx:151-166`, `apps/web/src/components/pagebuilder.tsx:69-74`
- Problem: the block renders `<form method="post" action={action}>` but the page builder never passes `action` or `onSubmit`, and there is no `/api/subscribe` route. No success or error state exists.
- Failure scenario: a visitor submits an email, sees the pending spinner, the browser does a full-page POST to the current route, and lands on a 405 or blank page. Nothing is captured.
- Fix: wire a Server Action or route handler, render success and error inline with `aria-live="polite"`, and hide the form (or render it disabled with a note) when no action is configured.

### AUD-014 Singletons can be duplicated or deleted, and two queries pick an arbitrary copy

- Severity: medium. Area: studio, sanity. Confidence: high.
- Files: `apps/studio/sanity.config.ts:70-80`, `packages/sanity/src/query.ts:188,319,352`
- Problem: only `hiddenTemplateIds` is set (hides the global "new document" menu). There is no `document.actions` filter, so Duplicate, Delete, and Unpublish remain on `settings`, `homePage`, `blogIndex`, `navbar`, `footer`. The `blogIndex` and `settings` queries use `*[_type == "..."][0]` with no `_id` pin (homePage, footer, navbar are pinned).
- Failure scenario: an editor duplicates Global Settings; the site title, favicon, and OG fallback now come from whichever copy `[0]` returns. Delete on Home Page blanks `/` until someone recreates the doc by id.
- Fix: add a `document.actions` filter removing those three actions for singleton types, and pin the two queries with `_id == "settings"` / `_id == "blogIndex"`.

### AUD-015 Unauthenticated server action can evict the whole cache

- Severity: medium. Area: web, security. Confidence: high on behavior, medium on whether to change it.
- Files: `apps/web/src/app/actions/revalidate.ts:24-27`, `apps/web/src/app/api/revalidate-sync-tags/route.ts`
- Problem: `revalidateSyncTags` is a public server action (the action id is in the HTML). `parseTags` only checks the `sanity:` prefix and there is no tag-count cap. The webhook route guards the same capability with a timing-safe secret and a 1000-tag cap. This is the documented next-sanity `<SanityLive action>` pattern, so it is a design trade, but the two guards are inconsistent.
- Failure scenario: anyone loops the action with `sanity:<anything>` tags and continuously evicts every cached page, forcing origin re-renders and Sanity API calls.
- Fix: cap `tags.length` in the action, and either accept the trade explicitly in a comment or require tags the Live event actually emitted.

### AUD-016 `sanityFetch` throws outside a `"use cache"` scope and nothing says so

- Severity: medium (latent crash). Area: sanity. Confidence: high that it throws.
- Files: `packages/sanity/src/live.ts:35-58`
- Problem: `sanityFetch` calls `cacheTag(...result.tags)` unconditionally. In Next 16.3.3 `cacheTag` throws when not inside a `"use cache"` function. All 18 current callers happen to be inside one; the JSDoc never states the precondition.
- Failure scenario: a developer calls `sanityFetch` from a plain Server Component, route handler, `generateMetadata`, or Server Action and every request to that route 500s with an error that reads as unrelated.
- Fix: state the precondition in the JSDoc and name (e.g. `sanityFetchCached`), or guard the `cacheTag` call and `Logger.warn` so an untagged read degrades to stale-until-revalidate.

### AUD-017 Markdown links absolutize against the wrong origin

- Severity: medium. Area: web. Confidence: high.
- Files: `apps/web/src/lib/markdown.ts:22`, `apps/web/src/utils.ts:3`
- Problem: `BASE_URL = env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` ignores `NEXT_PUBLIC_SITE_URL` and the preview URL, unlike `getBaseUrl()` which every other surface uses.
- Failure scenario: a non-Vercel deploy serves `/index.md` whose links point at `http://localhost:3000/...`. On a Vercel preview they point at production.
- Fix: `const BASE_URL = getBaseUrl();`

### AUD-018 `NEXT_PUBLIC_SITE_URL` is in the env schema but not in `.env.example` or CLAUDE.md

- Severity: medium. Area: env, docs. Confidence: high.
- Files: `packages/env/src/client.ts:38-40`, `apps/web/.env.example`, `CLAUDE.md`
- Problem: the schema comment says "Required off Vercel", but `apps/web/.env.example` and CLAUDE.md's web env list omit it. Also `NEXT_PUBLIC_VERCEL_URL` and `..._PRODUCTION_URL` transforms unconditionally prefix `https://`, so a value that already carries a scheme becomes `https://https://...`.
- Failure scenario: a self-hosted deploy copies `.env.example`, boots fine, and publishes `http://localhost:3000` canonicals, OG urls, and sitemap entries.
- Fix: add `NEXT_PUBLIC_SITE_URL=` to `apps/web/.env.example` and CLAUDE.md, and make the transforms scheme-aware.

### AUD-019 GROQ fragments duplicated byte-for-byte between two packages

- Severity: medium (drift). Area: sanity, sanity-blocks. Confidence: high.
- Files: `packages/sanity/src/query.ts:14-124`, `packages/sanity-blocks/src/internal/groq-fragments.ts:1-90`
- Problem: `imageFields`, `imageFragment`, `customLinkFragment`, `markDefsFragment`, `richTextFragment`, `buttonsFragment` are identical copies. Blog body, blog cards, author image, footer, and navbar use the local copies; blocks use the shared ones.
- Failure scenario: a field is added to the shared image projection; blocks get it, blog/footer/navbar do not, and the generated types silently diverge.
- Fix: export `./internal/groq-fragments` from `packages/sanity-blocks/package.json`, import it in `query.ts`, delete the copies.

### AUD-020 Redirects: build-time and runtime matchers diverge, and destinations are not origin-checked

- Severity: medium. Area: web, studio. Confidence: high.
- Files: `apps/web/next.config.ts:31-38`, `apps/web/src/app/api/markdown/route.ts:172-180,273-275`, `apps/studio/schemaTypes/documents/redirect.ts:101`, `apps/studio/functions/auto-redirect/index.ts:43-56`
- Problem: `next.config.ts` bakes redirects in at build and passes `source` raw to path-to-regexp (an editor typing `/old(` fails the build). The Markdown route re-reads them at runtime with exact `source === path`. So pattern redirects work for HTML but not `.md`, a trailing-slash source never matches Markdown, and a redirect added after deploy only affects `.md`. The Studio only checks `destination.startsWith("/")`, which `//evil.com` passes; `auto-redirect` writes with no validation; `next.config.ts` does no origin check (the Markdown route does).
- Failure scenario: a compromised editor token writes `destination: "//evil.com/login"` and the next build makes that path a cached 308 to an external host.
- Fix: in `redirects()` drop entries unless the destination is same-origin (`!startsWith("//")` or compare `new URL(dest, base).origin`), wrap `source` validation, and resolve Markdown redirects through the same matcher or document the gap.

### AUD-021 Editor-supplied hrefs bypass `sanitizeHref` in the app shell and FAQ

- Severity: medium (defense in depth). Area: web, sanity-blocks, security. Confidence: high.
- Files: `packages/sanity-blocks/src/faq-accordion/index.tsx:559-572`, `apps/web/src/components/navbar.tsx:258,286`, `mobile-menu.tsx:162,187`, `elements/menu-link.tsx:18`, `footer.tsx:101,269,331`, `github-stars.tsx:34`
- Problem: rich text, buttons, logo cells, social and showcase cards all route through `sanitizeHref`. Nav, footer, and the FAQ contact link render `href` straight from GROQ. The FAQ link also treats the `"#"` fallback as truthy and renders a dead link. Reaching this needs an API write bypassing the Studio's `isValidUrl`, and React 19 neutralizes `javascript:`, so only `data:` and odd schemes land today.
- Fix: wrap every editor href in `sanitizeHref(...)` and return null on `"#"`.

### AUD-022 Mux `policy` is read from `playback_ids[0]`, not the entry matching `playbackId`

- Severity: medium-low. Area: sanity-blocks. Confidence: low-medium.
- Files: `packages/sanity-blocks/src/internal/groq-fragments.ts:102-104`, `packages/sanity-blocks/src/internal/mux.ts:37-46`
- Problem: the plugin's own `getPlaybackId` prefers `drm`/`signed` over `public`, so assets with two policies exist. `muxPlaybackId` gates on the `[0]` policy.
- Failure scenario: an asset with `[signed, public]` and a stored public `playbackId` withholds a playable clip; the reverse ordering passes a signed id through as public and the player 403s.
- Fix: `"policy": asset->data.playback_ids[id == ^.playbackId][0].policy` (verify `^` scoping in Vision).

### AUD-023 `SanityIcon` renders a warning triangle on the server, then fetches one chunk per icon

- Severity: medium. Area: sanity-blocks, performance. Confidence: high.
- Files: `packages/sanity-blocks/src/internal/sanity-icon.tsx:3,26-35`, `packages/sanity-blocks/src/feature-cards-icon/index.tsx:32`, `apps/web/src/components/elements/menu-link.tsx:22`
- Problem: `lucide-react/dynamic` `DynamicIcon` is `useState` plus `useEffect`, so SSR HTML contains the `TriangleAlert` fallback for every feature card and menu link, then N sequential icon-chunk requests after hydration, then a visible swap.
- Fix: resolve icons on the server (`icons` map in a server-only module or a curated allow-list) and emit the `<svg>` in HTML. If it must stay client, use an empty `size-6` span as the fallback.

### AUD-024 `"use client"` placed too high inside blocks

- Severity: medium (once AUD-006 lands). Area: sanity-blocks, performance. Confidence: high.
- Files: `packages/sanity-blocks/src/subscribe-newsletter/index.tsx:1,32-58`, `packages/sanity-blocks/src/logo-cloud/index.tsx:1,52-68,76-96`, `packages/sanity-blocks/src/faq-accordion/index.tsx:1,136`
- Problem: newsletter is client only because the button uses `useFormStatus`. Logo cloud is client only for a hover `playbackRate` handler and renders `2 × max(20, n)` `SanityImage` instances (5 logos become 40 hydrated image components, 40 `<noscript>` srcsets, 40 LQIP copies). FAQ answers' `RichText` could be pre-rendered on the server.
- Fix: split the newsletter button into its own client file; make logo cloud a server component with CSS `:hover { animation-duration }` and cap the track to two viewport-wide cycles; pass FAQ answers as a server-rendered `ReactNode` map keyed by `_key`.

### AUD-025 React Query provider in the root layout for one feature

- Severity: medium. Area: web, performance. Confidence: high.
- Files: `apps/web/src/components/providers.tsx:3,7,11`, `apps/web/src/hooks/use-blog-search.ts:1`
- Problem: `@tanstack/react-query` (about 12 KB gzipped) loads on every page but is consumed only by blog search on `/blog`.
- Fix: move `QueryClientProvider` into `blog-search-layout.tsx`, or replace `useQuery` with a `useEffect` fetch plus `AbortController` and drop the dependency.

### AUD-026 Both tables of contents receive the full Portable Text body as client props

- Severity: medium. Area: web, performance. Confidence: high.
- Files: `apps/web/src/app/blog/[slug]/page.tsx:214-219,228-232`, `apps/web/src/components/elements/table-of-content.tsx:696-710,753-766`
- Problem: `richText` is passed to the client `TableOfContent` and `MobileTableOfContent`, so the article body is serialized into the RSC payload twice more in addition to the server `RichText` render. The TOC only needs headings.
- Fix: run `extractHeadingBlocks` / `processHeadingBlocks` on the server and pass a `headings[]` array.

### AUD-027 Proxy matcher runs on every static asset

- Severity: medium-low. Area: web, performance. Confidence: high.
- Files: `apps/web/src/proxy.ts:62-64`
- Problem: the matcher excludes only `api/`, `_next/`, robots, sitemap, and llms.txt, so `/favicon.ico`, `/favicon.svg`, `/static/**`, and every public file invoke the proxy (billed invocation and latency on Vercel).
- Fix: extend the negative lookahead with `favicon\.(?:ico|svg)|static/|.*\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|map|woff2?|ttf|mp4|webm|txt|xml)$` while keeping `.md` matched.

### AUD-028 Sticky navbar stacks six backdrop-filter layers

- Severity: medium (runtime). Area: web, performance. Confidence: medium (not measured).
- Files: `apps/web/src/components/navbar.tsx:46-98`
- Problem: five `backdrop-filter: blur()` layers plus a saturate layer under the `lg:sticky` header are re-rasterized every scroll frame.
- Fix: verify with DevTools paint flashing and FPS, then collapse to at most two layers (one masked blur plus one gradient tint).

### AUD-029 Autoplaying hero background video and logo marquee have no pause control

- Severity: medium (WCAG 2.2.2 Level A). Area: sanity-blocks, accessibility. Confidence: high.
- Files: `packages/sanity-blocks/src/hero/hero-video.tsx:156-181,206-220,233-246,293`, `packages/sanity-blocks/src/logo-cloud/index.tsx:63-74`
- Problem: WCAG requires a user control for auto-playing motion longer than 5 seconds. `prefers-reduced-motion` is honoured, but that is an OS preference, not a page control. The marquee only slows on hover and pauses on keyboard focus. Under reduced motion the marquee freezes a `w-max` track inside `overflow-hidden`, so logos past the viewport edge are invisible while their links remain tabbable.
- Fix: add a "Pause background video" toggle (`aria-pressed`, persisted in `localStorage`) and a marquee pause button; under reduced motion switch the logo track to a wrapping grid.

### AUD-030 Pages whose first block is not a hero have no `<h1>`

- Severity: medium. Area: web, accessibility, SEO. Confidence: high.
- Files: `apps/web/src/app/[...slug]/page.tsx:176-178`, `packages/sanity-blocks/src/internal/block-header.tsx:25`, `apps/web/src/components/breadcrumbs.tsx:105`
- Problem: every non-hero block renders its title as `<h2>`. The page title appears only as the current breadcrumb `<li>`. Screen-reader "jump to h1" lands nowhere.
- Fix: when `!hasLeadingHero` render the page `title` as `<h1>`, or give `BlockHeader` a `level` prop driven by `isFirst`.

### AUD-031 Blog pagination link contrast fails AA in light mode

- Severity: medium. Area: web, accessibility. Confidence: high (computed from oklch tokens).
- Files: `apps/web/src/components/blog-pagination.tsx:91,127,141`
- Problem: `text-zinc-400` on white is 2.56:1 (2.33:1 on the zinc-100 hover surface). AA needs 4.5:1. Dark mode is fine.
- Fix: use `text-muted-foreground` (7.7:1 on white).

### AUD-032 No skip link

- Severity: medium (WCAG 2.4.1). Area: web, accessibility. Confidence: high.
- Files: `apps/web/src/app/layout.tsx:59-75`, `page.tsx:63`, `[...slug]/page.tsx:176`, `blog/[slug]/page.tsx:159`, `blog-page-content.tsx:37`
- Problem: keyboard and screen-reader users tab through the logo, every nav item, GitHub link, and CTA buttons on every page before reaching `<main>`.
- Fix: first child of `<body>`: `<a href="#main" className="sr-only focus:not-sr-only ...">Skip to content</a>` and `id="main"` on each `<main>`.

### AUD-033 No `error.tsx` or `global-error.tsx`

- Severity: medium. Area: web. Confidence: high.
- Files: `apps/web/src/app/`
- Problem: a thrown render error (for example a Sanity fetch failure inside `CachedHome`) shows Next's default unstyled error screen in production with no way back, unlike the well-made `not-found.tsx`.
- Fix: add `app/error.tsx` (client, `reset` button styled like not-found) and `app/global-error.tsx` (renders its own `<html>`/`<body>`).

### AUD-034 Pinned footer is focusable while hidden behind page content

- Severity: medium. Area: web, accessibility. Confidence: medium (needs a manual tab-through).
- Files: `apps/web/src/components/sticky-footer.tsx:118`, `apps/web/src/app/layout.tsx:72`, `apps/web/src/components/footer.tsx:98-108,267-283`
- Problem: the footer is `fixed z-0` behind the `z-10` content wrapper and revealed only by scrolling. Tabbing into footer links focuses elements physically hidden behind the page; the browser cannot scroll a fixed element into view, so the focus ring vanishes.
- Fix: on `focusin` inside the footer while pinned, scroll to the document bottom; or use the in-flow layout for keyboard users and under reduced motion.

### AUD-035 Blog image alt text overrides the CMS alt and duplicates adjacent text

- Severity: medium. Area: web, accessibility. Confidence: high.
- Files: `apps/web/src/components/blog-card.tsx:23,78`, `apps/web/src/app/blog/[slug]/page.tsx:195`, `packages/sanity-blocks/src/internal/groq-fragments.ts:3-10`
- Problem: `BlogImage` forces `alt={title ?? "Blog post"}` inside an `<article>` whose heading link is the same title, so screen readers hear it twice. Avatars get `alt={author.name}` next to the visible name. The shared GROQ `alt` also coalesces to `asset->originalFilename` then `"untitled"`, so images without an alt field announce `IMG_1234.jpg`.
- Fix: drop the overrides so CMS alt flows through, pass `alt=""` for decorative images, and stop coalescing to the filename.

### AUD-036 "Link Broken" is rendered to real visitors

- Severity: medium. Area: sanity-blocks. Confidence: high.
- Files: `packages/sanity-blocks/src/internal/sanity-buttons.tsx:57-60`, `packages/sanity-blocks/src/internal/rich-text.tsx:94-101`
- Problem: an editor typo in a URL (or a scheme stripped by `sanitizeHref`) ships a visible non-functional `<Button>Link Broken</Button>` or underlined "Link Broken" span in production.
- Fix: outside draft mode render the plain text with no link and log via `@workspace/logger`; keep the hint only when draft or stega is active.

### AUD-037 No tests for the web app's HTTP surface, queries, env, or Studio logic

- Severity: medium. Area: tests. Confidence: high.
- Files: `apps/web/src/app/api/revalidate-sync-tags/route.ts:13-51`, `apps/web/src/lib/markdown-path.ts`, `apps/web/src/proxy.ts:15-64`, `apps/web/src/app/api/markdown/route.ts`, `apps/web/src/app/api/ask/route.ts`, `packages/sanity/src/query.ts`, `packages/env/src/client.ts`, `apps/studio/utils/slug-validation.ts`, `apps/studio/documents.ts:25-44`, `apps/studio/functions/**`
- Problem: Vitest reaches only `@workspace/sanity-blocks`. Zero tests for `apps/web`, `apps/studio`, `packages/sanity`, `packages/env`, `packages/ui`, `packages/logger`. The revalidate secret comparison is covered only by e2e on Vercel previews. Fifteen `defineQuery` strings are never parsed (a GROQ syntax error surfaces at first request or at build in `redirects()`). The last three commits on main were fixes in `documents.ts`, which has no test.
- Fix (minimal high-value set): vitest for web in node env with table tests for `prefersMarkdown`, `normalizeMarkdownPath`, `secretsMatch` and body validation, `isRateLimited`, `readQuestion`, `getBaseUrl`, `parseBlogPageParam`, `parseRepo`; a test that `groq-js` `parse()` succeeds for every exported query; `createEnv` fixtures; vitest for the Studio pure modules and both Functions with a stubbed client; a unit test that every `blockSchemas` name has a case in both `page-builder-to-markdown.ts` and `renderBlockComponent`.

### AUD-038 Renovate cap silently blocks `@sanity/ui` and `@sanity/icons` updates

- Severity: medium. Area: CI, deps. Confidence: high.
- Files: `.github/renovate.json:16-23`, `apps/studio/package.json:30,32`
- Problem: the rule caps both at `<4` "because sanity-plugin-lucide-icon-picker is on the v3 line", but the Studio already declares `@sanity/icons ^5.2.1` and `@sanity/ui ^4.0.6` and uses v4 subpath imports. Renovate never opens an update PR for either.
- Fix: delete that packageRule (keep the `@sanity/client <8` rule, which matches the catalog comment).

### AUD-039 Dependency audit: 9 advisories (4 high, 5 moderate), all transitive

- Severity: medium. Area: deps. Confidence: high (`pnpm audit` output).
- Problem: all nine come through `sanity`, `next-sanity`, and `@robotostudio/sanity-plugin-lucide-icon-picker` (which pins its own older `sanity` and `browserslist` line). None are in code paths this repo calls directly at runtime; the DoS vectors are CLI and build tooling.

| Package | Installed | Fix | Severity | Pulled in by |
|---|---|---|---|---|
| smol-toml | 1.5.2 | >=1.7.1 | high + moderate | sanity, next-sanity, all studio plugins |
| adm-zip | 0.6.0 | >=0.6.1 | high + moderate | sanity CLI (workbench, runtime-cli) |
| browserslist | 4.28.2 | >=4.28.7 | high ×2 | lucide-icon-picker |
| uuid | 10.x / 3.0.3 | >=11.1.1 | moderate | sanity, next-sanity |
| baseline-browser-mapping | 2.10.32 | >=2.11.0 | moderate | lucide-icon-picker |
| undici | 7.29.0 | >=7.29.1 | moderate | lucide-icon-picker |

- Fix: bump `sanity` catalog `^6.11.0` to 6.16.0 (current latest) and `next-sanity` to 13.3.4, then add `pnpm.overrides` for `smol-toml`, `adm-zip`, `browserslist`, `uuid`, `baseline-browser-mapping`, `undici` for whatever remains. Ask the plugin author to loosen its `sanity` peer range. `pnpm-workspace.yaml:65` has a long `minimumReleaseAgeExclude` list but no `minimumReleaseAge` key; set it explicitly (Renovate automerge is on).

### AUD-040 Biome warnings and import order are never enforced in CI

- Severity: medium. Area: CI, tooling. Confidence: high.
- Files: `biome.jsonc:34-52,107-123`, `.github/workflows/ci.yml`
- Problem: `noExplicitAny`, `noConsole`, `useExhaustiveDependencies`, `noExcessiveCognitiveComplexity` are `warn` and `biome lint` exits 0 on warnings. Import ordering is an assist action that only `biome check` enforces; CI runs `lint` and `format:check` separately.
- Fix: run `biome check .` in CI (or `--error-on-warnings`).

### AUD-041 Studio tsconfig does not extend the shared base

- Severity: medium. Area: studio, tooling. Confidence: high.
- Files: `apps/studio/tsconfig.json`, `packages/typescript-config/base.json`
- Problem: `strict: true` but no `noUncheckedIndexedAccess`, and `functions/**` and `migrations/**` are type-checked under the looser config. `sanity.blueprint.ts` is excluded from type-check (`tsconfig.json:20`) and from Biome (`biome.jsonc:81-91`) although a manual `tsc` passes today.
- Fix: extend base in the Studio tsconfig and drop `sanity.blueprint.ts` from `exclude`.

### AUD-042 Playwright conditional skips silently shrink coverage

- Severity: medium. Area: tests. Confidence: high.
- Files: `apps/web/tests/e2e/presentation-blocks.spec.ts:127,133,166,204,208`, `presentation-nested-pages.spec.ts:196`, `presentation-releases.spec.ts:151`, `presentation-guardrails.spec.ts:208`
- Problem: tests skip when the e2e dataset lacks an image or a public Mux asset, when Functions are not deployed, or on API version. If the dataset is missing an asset, logoCloud and videoFeature are never verified and the run is still green.
- Fix: seed the e2e dataset with the required fixtures and turn the skips into failures when `process.env.CI` is set.

### AUD-043 `generateMetadata` refetches the full page into a second cache entry and waterfalls settings

- Severity: medium-low. Area: web, performance. Confidence: medium.
- Files: `apps/web/src/app/[...slug]/page.tsx:66-70`, `blog/[slug]/page.tsx:71-75`, `page.tsx:20-23`, `apps/web/src/lib/seo.ts:37-44,134`
- Problem: `sanityFetchMetadata` runs the full page query (whole page builder) in a different `use cache` function from `getPublishedSlugPage`, so the same document is stored twice; then settings are awaited sequentially.
- Fix: reuse `getPublishedSlugPage(slug)` or a lean SEO-fields query, and `Promise.all` the settings fetch.

### AUD-044 Article JSON-LD publisher is always the hardcoded fallback

- Severity: medium-low. Area: web, SEO. Confidence: high.
- Files: `apps/web/src/components/json-ld.tsx:97-106,191-201`, `apps/web/src/app/blog/[slug]/page.tsx:160`
- Problem: `ArticleJsonLd` accepts `settings` but `BlogPageContent` never passes it, so every article emits `publisher.name: "Turbo Start Sanity"` with no logo. `CombinedJsonLd`'s `settings` and `article` props are likewise ignored.
- Fix: fetch `getJsonLdSettings()` in `BlogPageContent` (already `"use cache"`d) and pass it, or drop the unused props.

### AUD-045 Home and slug pages flash blank on every Presentation navigation

- Severity: medium-low. Area: web. Confidence: high.
- Files: `apps/web/src/app/page.tsx:30-36`, `apps/web/src/app/[...slug]/page.tsx:80-84`, `apps/web/src/app/blog/[slug]/page.tsx:84-92` (correct)
- Problem: the draft path is wrapped in `<Suspense fallback={null}>` on home and slug pages. The blog page deliberately does not, with a comment explaining why: `use cache` is bypassed in draft mode so the fallback always paints.
- Fix: drop the Suspense wrapper on the draft branch of the two pages, matching the blog page.

### AUD-046 `SanityLive` mounts for every anonymous visitor

- Severity: medium-low (design trade). Area: web, performance. Confidence: medium.
- Files: `apps/web/src/app/layout.tsx:109`
- Problem: `@sanity/client` (20 to 30 KB gzipped) in the visitor bundle, a persistent Live Content API EventSource per tab, and on every publish every open tab runs the `revalidateSyncTags` action plus `router.refresh()`.
- Fix: if live updates for the public are not a requirement, render `<SanityLive>` only when `isDraftMode` and rely on the `/api/revalidate-sync-tags` webhook.

---

## LOW

### AUD-047 Unreferenced `/api/disable-draft` route with a CSRF-able side effect

- Files: `apps/web/src/app/api/disable-draft/route.ts`, `apps/web/src/app/actions.ts`
- Problem: nothing links to the route (the PreviewBar uses the `disableDraftMode` server action; the Studio only configures `previewMode.enable`). It is a GET with a side effect and the draft cookie is `SameSite=None`, so `<img src="https://site/api/disable-draft">` on a third-party page kicks an editor out of preview.
- Fix: delete the route (and `internalPathOnly` if unused), or check `Sec-Fetch-Site`.

### AUD-048 `/api/presentation-draft` 500s instead of 503 on a placeholder token

- Files: `apps/web/src/app/api/presentation-draft/route.ts:6`, `packages/sanity/src/live.ts:14-16`
- Problem: `live.ts` treats a non-`sk...` `SANITY_API_READ_TOKEN` as unset, but this route passes it to `validatePreviewUrl` anyway.
- Fix: reuse the same `readToken` guard and return 503 when it is `false`.

### AUD-049 `/api/blog/search` has no query length cap and rebuilds the Fuse index per request

- Files: `apps/web/src/app/api/blog/search/route.ts:24-44`
- Problem: a 1 MB `q` makes Fuse scan every post across 4 keys; each unique `q` bypasses cache. A new index is built from the cached array on every request.
- Fix: `if (query.length > 100) return 400`; memoize the index in a `WeakMap<data, Fuse>`.

### AUD-050 `/blog.md` fetches every post with images and authors to print title and slug

- Files: `apps/web/src/app/api/markdown/route.ts:62-69`
- Fix: use `querySitemapData.blogPages` as `llms.txt` does.

### AUD-051 Viewer token delivered to draft-mode browsers

- Files: `packages/sanity/src/live.ts:19-26`
- Problem: `browserToken: readToken` gives any draft-session holder a dataset-wide read token. Documented next-sanity behaviour; matters more because of AUD-002 and AUD-012.
- Fix: set `browserToken: false` unless standalone live previews are needed.

### AUD-052 Auto-redirect Function output is dormant until the next web deploy, and undocumented

- Files: `apps/studio/sanity.blueprint.ts:18-29`, `apps/studio/functions/auto-redirect/index.ts`, `apps/web/next.config.ts:31-38`, `CLAUDE.md`
- Problem: the Function writes `redirect` documents on slug change, but the web reads them only at build (the Markdown route is the only runtime consumer). Nothing triggers a rebuild. The filter `delta::changedAny(slug.current)` has no `_type` guard. CLAUDE.md never mentions `auto-redirect`, `sanity.blueprint.ts`, or `apps/studio/migrations/`.
- Fix: document the build-time nature or add a runtime redirect lookup in `proxy.ts`; add `&& _type in ["page","blog"]` to the filter; update CLAUDE.md.

### AUD-053 SEO and OG "required" warnings never fire

- Files: `apps/studio/utils/seo-fields.ts:12,23`, `apps/studio/utils/og-fields.ts:12,23`
- Problem: `rule.warning("...")` with no constraint adds no rule, so the nudge never shows.
- Fix: `rule.required().warning("...")` or delete the dead rule.

### AUD-054 Redirect list preview always says "Permanent"

- Files: `apps/studio/schemaTypes/documents/redirect.ts:121-133,144`
- Problem: `permanent` is the string `"true"`/`"false"` and `"false"` is truthy. `query.ts:367` does it right. Also `auto-redirect/index.ts:52` writes `permanent: "true"` as a string; verify against the schema.
- Fix: `permanent === "true" ? "Permanent" : "Temporary"`.

### AUD-055 Root `pnpm test:e2e` loses e2e env vars under turbo strict env mode

- Files: `turbo.json` (`test:e2e` task `env: []`), `apps/web/playwright.config.ts`, `apps/web/playwright.presentation.config.ts`
- Problem: `VERCEL_AUTOMATION_BYPASS_SECRET`, `SANITY_E2E_SESSION_TOKEN`, `SANITY_E2E_DATASET`, `SANITY_E2E_FUNCTIONS_DEPLOYED`, `CI` are not in `globalEnv` or the task `env`, so the documented root command runs Playwright without the bypass secret (401s). CI is unaffected because it calls `pnpm --filter web test:e2e` directly.
- Fix: add them to the task `env` or `globalPassThroughEnv`.

### AUD-056 `SANITY_API_WRITE_TOKEN` is required with no runtime reader

- Files: `packages/env/src/server.ts:14`
- Fix: `.optional()` (CLAUDE.md already acknowledges the caveat).

### AUD-057 `DEFAULT_SANITY_API_VERSION` is `new Date()` at module load and reaches the browser

- Files: `packages/env/src/constants.ts:4`, `packages/sanity/src/client.ts`
- Problem: a visitor with a clock set ahead sends a future `apiVersion`; server (boot date) and browser (today) disagree across midnight.
- Fix: pin a literal date.

### AUD-058 Inline-image alt and caption not Markdown-escaped

- Files: `packages/sanity-blocks/src/internal/portable-text-to-markdown.ts:226-227`, `packages/sanity-blocks/src/internal/markdown.ts:174-176` (correct)
- Problem: alt `"Chart [Q1]"` breaks the `![...](...)` syntax.
- Fix: run both through `escapeMarkdown`.

### AUD-059 Heading slugs strip every non-ASCII character

- Files: `packages/sanity-blocks/src/internal/heading-slug.ts:29-30`
- Problem: `remove: /[^a-zA-Z0-9 ]/g` gives CJK, Cyrillic, and Arabic headings `id=""`, and identical headings get identical ids; TOC anchors die.
- Fix: `strict: true` plus an index or hash fallback and a dedupe pass.

### AUD-060 `suppressHydrationWarning` on every Button

- Files: `packages/ui/src/components/button.tsx:51`
- Problem: masks real hydration mismatches across the whole UI.
- Fix: remove, or scope to the one element that needs it.

### AUD-061 Duplicate hard-coded section ids across blocks

- Files: `cta/index.tsx:56`, `faq-accordion/index.tsx:616`, `feature-cards-icon/index.tsx:63`, `hero/index.tsx:181,196`, `hero-split/index.tsx:27`, `logo-cloud/index.tsx:66`, `showcase-grid/index.tsx:390,400`, `social-grid/index.tsx:139`, `subscribe-newsletter/index.tsx:125`, `video-feature/index.tsx:33` (all under `packages/sanity-blocks/src/`)
- Problem: two CTAs on a page produce duplicate `id="cta"`: invalid HTML, `#cta` anchors hit the first only.
- Fix: derive from `_key` or drop the ids.

### AUD-062 `target="_blank"` links without a new-tab announcement

- Files: `apps/web/src/components/footer.tsx:99-108,329-336`, `packages/sanity-blocks/src/showcase-grid/index.tsx:268-276,348-356`, `social-grid/index.tsx:114-119`, `internal/logo-link-cell.tsx:62-70`, `apps/web/src/components/elements/table-of-content.tsx:631-638`
- Problem: `rel` is present everywhere (good) but only `GithubStars`, `SanityButtons`, and rich-text links append "(opens in a new tab)". Showcase card link names also include the inner image alts.
- Fix: reuse the sr-only pattern; give showcase inner images `alt=""`.

### AUD-063 Content video autoplay ignores `prefers-reduced-motion`

- Files: `packages/sanity-blocks/src/internal/mux-video.tsx:54-58,85-101`
- Fix: `const autoPlay = Boolean(options?.autoPlay) && !prefersReducedMotion` (reuse `usePrefersReducedMotion`).

### AUD-064 Per-image `<noscript>` duplicates the full srcset

- Files: `packages/sanity-blocks/src/internal/sanity-image.tsx:153-161,168-205`
- Problem: 3 to 8 candidates per image, roughly 0.5 to 1.5 KB each, 40 to 60 KB on a logo-cloud page.
- Fix: emit only `src` in the noscript, or skip it for `width <= 240`.

### AUD-065 Small React and DOM inefficiencies

- `apps/web/src/components/navbar.tsx:171-176` interleaves `getBoundingClientRect` reads with `dataset` writes (layout thrash); read all rects first.
- `apps/web/src/components/elements/table-of-content.tsx:583-587` mirrors `window.location.href` into state via an effect although `shareUrl` is computed server-side; read lazily in handlers.
- `apps/web/src/components/logo.tsx:23` `priority` defaults to `true`, so footer (`footer.tsx:232`) and drawer (`mobile-menu.tsx:126`) logos load eagerly; pass `priority={false}`.
- `apps/web/src/components/navbar.tsx:201-207`, `mobile-menu.tsx:48-51` serialize the whole `settingsData` to the client but read only `siteTitle` and `logos`.
- `apps/web/src/app/api/ask/route.ts:71-85` creates an MCP client and refetches `tools()` on every question.

### AUD-066 Dead code and stale exports

- `packages/sanity-blocks/src/internal/rendering.tsx` (`getHref`, `renderPortableText`, `renderButtons`, `IconBadge`, `renderOptionalHeading`): no consumer except its own test; exported at `packages/sanity-blocks/package.json:64`. `getHref` also prepends `/` (different semantics from `sanitizeHref`). Delete file, test, and export.
- `packages/sanity/src/query.ts:147-152` `queryImageType` and `QueryImageTypeResult`: never imported.
- `packages/sanity/src/live.ts:115` `resolvePageFetchOptions` is a pure alias of `getDynamicFetchOptions`.
- `packages/sanity-blocks/src/faq-accordion/faq-accordion.groq.ts:6` `"eyebrow": coalesce(eyebrow, null)` is a no-op.
- `packages/sanity-blocks/src/hero/hero-video.tsx` re-exports `isMuxPath`, `mediaTypeOf`, `HeroMediaType` that nothing imports from there.
- Unused exports per knip: `apps/studio/schemaTypes/definitions/pagebuilder.ts` `pagebuilderBlockTypes`, `rich-text.ts` `memberTypes`, `apps/web/src/components/breadcrumbs.tsx` `humanizeSegment`, `apps/web/src/lib/markdown.ts` `resolveImageUrl`, `apps/web/src/lib/seo.ts` `getSEOMetadata`, `blog-pagination.tsx` `PaginationProps`, `internal/markdown.ts` Markdown* types, `internal/table-block.tsx` cell/row types.
- Unused dependencies per knip: `apps/studio` `react-is` (and `@sanity/functions`, likely a knip false positive since `functions/**` are separate entrypoints; verify), `packages/sanity` `react-is`, `packages/tailwind-config` `tailwindcss`, `tw-animate-css` (verify; these may be needed as peer-style deps for the shared CSS).
- `apps/studio/package.json` `friendlier-words` is deprecated on npm.

### AUD-067 Studio field action and slug preview inconsistencies

- `apps/studio/plugins/presentation-url.ts:57` `hidden: documentId === "root"` is dead (`documentId` is never `"root"`); `:31` types field actions as `DocumentActionComponent[]`. Scope on `path.length === 0` and fix the type.
- `apps/studio/components/slug-field-component.tsx:17,56` reads `process.env.SANITY_STUDIO_PRESENTATION_URL` directly instead of `getPresentationUrl()`, so in dev with the var unset the preview link is a bare `/about`.

### AUD-068 Test quality gaps in the existing suite

- `packages/sanity-blocks/src/subscribe-newsletter/subscribe-newsletter-markdown.test.ts:57` asserts only `/<(form|input|button)/i`; every other block asserts `/<[A-Za-z]/`, so a leaked `<RichText/>` would pass. Align the regex.
- `packages/sanity-blocks/src/showcase-grid/showcase-grid.test.tsx:17-38` "promotes the first item" and "honours an explicit featured flag" assert the identical thing; the featured logic (`index.tsx:195-274`) is unverified.
- `cta.test.tsx` and `rich-text-block.test.tsx` are presence-only (no href, marks, or lists).
- Lucide mocks accept any icon name, so a dropped brand icon (lucide v1 removed 19) passes in tests but renders the fallback in production.
- `para()` helper re-declared in 5+ markdown tests; `READY_MUX` duplicated in `hero.test.tsx:77` and `media-type.test.ts:7`. Add `testing/fixtures.ts`.
- No coverage provider or thresholds. Add `@vitest/coverage-v8` with a `lines` threshold scoped to `src/**`.
- `packages/sanity-blocks/vitest.config.ts:11,15,19,26,30,36,44,50` use `__dirname`, which triggers the Vite "unsupported by configLoader: native" warning. Use `import.meta.dirname` (Node 24).
- `apps/web/tests/e2e/table-of-content.spec.ts:83-89` 3 s polls plus a 20 × 100 ms scroll loop (flake risk); `presentation-inline-edit.spec.ts:102,134` `waitForTimeout(5000)` / `(2000)`.

### AUD-069 Documentation drift

- `CLAUDE.md` says block schemas use lucide-react "(all ten do)"; there are eleven (`packages/sanity-blocks/src/sanity-blocks.ts:25-37`).
- `CLAUDE.md` presents `invalidate-tags` as the only Sanity Function and never mentions `auto-redirect`, `sanity.blueprint.ts`, or `apps/studio/migrations/`.
- `README.md` has no section on `sanity blueprints deploy` (see AUD-003).
- No `.nvmrc` or `.node-version`; CI pins Node 24.21.0 but local Node is unpinned (this container ran on 22 and everything passed, but `engines` says 24 or newer).

### AUD-070 Small accessibility and UX polish

- `apps/web/src/components/footer.tsx:258` column headings at `/60` opacity are about 4.46:1, a hair under AA; use `/70`.
- `packages/sanity-blocks/src/social-grid/index.tsx:105` `transition-all`; list the properties.
- Ellipsis typography: `faq-accordion/index.tsx:214` "Thinking...", `preview-bar.tsx:35`, `subscribe-newsletter/index.tsx:36` use three dots; use "…".
- `subscribe-newsletter/index.tsx:157-164` email input lacks `autoComplete="email"`, `spellCheck={false}`, `inputMode="email"`; `blog-search.tsx:33-39` lacks `type="search"`, `autoComplete="off"`.
- No `<meta name="theme-color">`.
- `video-feature/index.tsx:41-53` renders a `<figure>` with only a `<figcaption>` when the asset is missing but a caption is set; gate on `hasVideo`.
- `footer.tsx:269` `href={link.href ?? "#"}` ships dead `#` links; skip the item.
- Blog search query and FAQ category filter live only in `useState` (not deep-linkable or back-button safe).
- `navbar.tsx:218` sticky 64 px header; only rich-text headings carry `scroll-margin`. Add `scroll-padding-top: 4rem` on `html` at `lg`.
- `packages/ui/src/styles/globals.css:300-314,360-370` scroll-driven `hero-blur` is not disabled under `prefers-reduced-motion`.
- `footer-theme-toggle.tsx:40` three `aria-pressed` buttons with no group name; wrap in `role="group" aria-label="Theme"`.
- `page.tsx:55` "No home page data" and `[...slug]/page.tsx:152-159` empty states render without a `<main>` landmark.

---

## Quick triage table

| ID | Sev | Area | Title |
|---|---|---|---|
| AUD-001 | high | web/build | GitHub 403 during prerender fails `next build` (confirmed in CI) |
| AUD-002 | high | security | Seed tarball ships Presentation preview secrets |
| AUD-003 | high | studio/functions | Deployed invalidate-tags Function has no env vars |
| AUD-004 | high | sanity-blocks | Hero schema and renderer disagree on blank `mediaType` |
| AUD-005 | high | studio | Presentation locations keyed on nonexistent `home` type |
| AUD-006 | high | perf | Whole page builder is a Client Component |
| AUD-007 | high | perf | LCP hero image invisible until hydration |
| AUD-008 | high | a11y/SEO | Hero hard-codes `<h1>`, emits it empty |
| AUD-009 | high | CI | No web build or type-gen drift check in CI |
| AUD-010 | medium | security | No security headers |
| AUD-011 | medium | security/cost | `/api/ask` abuse: per-instance limit, no origin check |
| AUD-012 | medium | security | `secrets.mux` readable on a public dataset |
| AUD-013 | medium | blocks | Newsletter form posts to nowhere |
| AUD-014 | medium | studio | Singletons can be duplicated; unpinned queries |
| AUD-015 | medium | security | Unauthenticated server action evicts whole cache |
| AUD-016 | medium | sanity | `sanityFetch` throws outside `use cache`, undocumented |
| AUD-017 | medium | web | Markdown links use wrong base URL |
| AUD-018 | medium | env/docs | `NEXT_PUBLIC_SITE_URL` missing from `.env.example`; scheme double-prefix |
| AUD-019 | medium | sanity | GROQ fragments duplicated across packages |
| AUD-020 | medium | web/studio | Redirects: build vs runtime divergence, no origin check |
| AUD-021 | medium | security | App-shell and FAQ hrefs bypass `sanitizeHref` |
| AUD-022 | medium-low | blocks | Mux policy read from wrong playback id |
| AUD-023 | medium | perf | `SanityIcon` SSR fallback plus per-icon chunk fetch |
| AUD-024 | medium | perf | `"use client"` too high in newsletter, logo cloud, FAQ |
| AUD-025 | medium | perf | React Query provider in root layout |
| AUD-026 | medium | perf | TOC receives full Portable Text body |
| AUD-027 | medium-low | perf | Proxy matcher runs on static assets |
| AUD-028 | medium | perf | Six backdrop-filter layers in sticky navbar |
| AUD-029 | medium | a11y | No pause control for hero video and logo marquee |
| AUD-030 | medium | a11y/SEO | Non-hero pages have no `<h1>` |
| AUD-031 | medium | a11y | Pagination contrast fails AA |
| AUD-032 | medium | a11y | No skip link |
| AUD-033 | medium | web | No `error.tsx` / `global-error.tsx` |
| AUD-034 | medium | a11y | Pinned footer focusable while hidden |
| AUD-035 | medium | a11y | Blog image alt overrides CMS alt; filename fallback |
| AUD-036 | medium | blocks | "Link Broken" shown to visitors |
| AUD-037 | medium | tests | No tests for web HTTP surface, queries, env, Studio |
| AUD-038 | medium | CI/deps | Renovate cap blocks `@sanity/ui`, `@sanity/icons` |
| AUD-039 | medium | deps | 9 transitive advisories (4 high) |
| AUD-040 | medium | CI | Biome warnings and import order not enforced |
| AUD-041 | medium | tooling | Studio tsconfig skips base config; blueprint unchecked |
| AUD-042 | medium | tests | Playwright skips hide missing coverage |
| AUD-043 | medium-low | perf | Metadata refetch and settings waterfall |
| AUD-044 | medium-low | SEO | Article JSON-LD publisher always fallback |
| AUD-045 | medium-low | web | Home and slug pages flash blank in Presentation |
| AUD-046 | medium-low | perf | `SanityLive` for every visitor |
| AUD-047 | low | security | Unreferenced `/api/disable-draft` CSRF-able |
| AUD-048 | low | web | presentation-draft 500 on placeholder token |
| AUD-049 | low | web | Search query unbounded; Fuse index per request |
| AUD-050 | low | web | `/blog.md` over-fetches |
| AUD-051 | low | security | Viewer token to draft-mode browsers |
| AUD-052 | low | studio/docs | Auto-redirect dormant until deploy; undocumented |
| AUD-053 | low | studio | SEO/OG warnings never fire |
| AUD-054 | low | studio | Redirect preview always "Permanent" |
| AUD-055 | low | tooling | Root `pnpm test:e2e` loses env vars |
| AUD-056 | low | env | `SANITY_API_WRITE_TOKEN` required, unused |
| AUD-057 | low | env | API version is `new Date()` at load |
| AUD-058 | low | blocks | Inline-image alt not Markdown-escaped |
| AUD-059 | low | blocks | Heading slugs drop non-ASCII |
| AUD-060 | low | ui | `suppressHydrationWarning` on every Button |
| AUD-061 | low | a11y | Duplicate section ids |
| AUD-062 | low | a11y | New-tab links unannounced |
| AUD-063 | low | a11y | Content video autoplay ignores reduced motion |
| AUD-064 | low | perf | `<noscript>` duplicates srcset |
| AUD-065 | low | perf | Small React/DOM inefficiencies |
| AUD-066 | low | cleanup | Dead code and stale exports |
| AUD-067 | low | studio | Field action and slug preview inconsistencies |
| AUD-068 | low | tests | Test quality gaps |
| AUD-069 | low | docs | Documentation drift |
| AUD-070 | low | a11y | Small accessibility and UX polish |

## Verified as OK (for context, no ticket needed)

- Secrets: no tokens or keys in tracked files; `.gitignore` covers `.env*`; `.mcp.json` uses placeholders; only `NEXT_PUBLIC_*` reaches the client; tokens read only in `live.ts`, `presentation-draft`, `ask`.
- `/api/revalidate-sync-tags`: Bearer, `timingSafeEqual` with length guard, fails closed, body validated, 1000-tag cap.
- `/api/markdown` and `proxy.ts`: path is a GROQ param, draft data only with a draft cookie, same-origin redirects, `nosniff`, `noindex`, `Vary: Accept`, client cannot override `x-markdown-*` headers.
- Draft mode: secret validated with 1 h TTL, `redirectTo` reduced to path, drafts without session only in development, `use cache` keyed on perspective and bypassed in draft.
- XSS: only `dangerouslySetInnerHTML` is JSON-LD with `\uXXXX` escaping and `stegaClean`; no raw HTML Portable Text serializers; Markdown output never rendered as HTML.
- GROQ: every dynamic value is a bound param; images not over-expanded; listings use card fragments; navbar and footer fetched in `Promise.all`.
- Mux helpers: `muxPlaybackId` gating, stega cleaning, `disableTracking`, `mux-mp4` never inferred.
- Workflows: actions SHA-pinned, least-privilege permissions, `persist-credentials: false`, no `pull_request_target`, fork guard before secrets, `queue: max` is a valid concurrency key, e2e dataset never production.
- Node 24.21.0 pinned in CI, pnpm 11.24.0 via `packageManager`, frozen lockfile, `allowBuilds` limited, no git or tarball deps.
- Accessibility basics: `lang`, landmarks, focus-visible everywhere, icon-only controls named, live regions, native `<details>`, mobile drawer, hero video `aria-hidden` and muted, images carry `sizes` and dimensions, rich-text `h1` demoted, `th scope`.
- All 11 blocks have render and markdown tests; `schema.json`, generated types, and thumbnails are in sync with the source today.
