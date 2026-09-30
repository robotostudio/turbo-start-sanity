# Audit findings: research backing and corrections

Date: 2026-09-30. Companion to `audit-findings.md` (the ticket list). Branch `claude/happy-brahmagupta-99c7k6`.

## What this file is

Every finding in `audit-findings.md` was handed to a researcher with one job: find the normative source (the WCAG success criterion, the Next.js or Sanity doc page, the OWASP cheat sheet, the GitHub advisory, the installed package source) and say whether it **confirms**, **adds nuance to**, or **contradicts** the finding as written. Quotes are verbatim from pages fetched on 2026-09-30. Where no source could be found, that is stated rather than papered over.

Use it two ways:

1. **When writing a ticket**, copy the "Sources" bullets and "Verdict" line for that AUD id into the ticket body. Reviewers then argue with the spec, not with the auditor.
2. **Before prioritising**, read the corrections table below. Research changed the severity or the story for 12 findings and added 11 new ones.

Method: five researchers by domain (security, Next.js and performance, accessibility, Sanity, CI and tooling), each with web access and read access to the repo and `node_modules`. Nothing was edited.

## Corrections to the first report

Read these before creating tickets from `audit-findings.md`.

| ID | What changed | Why |
|---|---|---|
| AUD-001 | Mechanism now stated as "observed, not fully explained". Severity unchanged (high). | The CI log proves the export aborts on the 403. Next's own error-handler comment says a cache-scope error caught in userland should not surface, and no doc says otherwise. Reproduce with `next build --debug-prerender` before asserting why. The fix is correct either way. Also: a build-only skip via `NEXT_PHASE` is undocumented for app code and leaves crawler and revalidation requests unauthenticated. |
| AUD-012 | **Scenario was wrong.** Re-rated high → medium-low. Remediation re-pointed. | Sanity docs: documents whose id contains a dot need a token even on public datasets. An unauthenticated GROQ query returns nothing. The real gate is any read token, including the Viewer token this template hands to every draft-mode browser (AUD-051). Both READMEs state the wrong threat model. |
| AUD-051 | Raised low → medium. Fix this before AUD-012. | It is the actual exposure path for `secrets.mux` and the payoff of a leaked preview secret (AUD-002). `browserToken: false` is a typed, supported opt-out. |
| AUD-039 | Two provenance cells corrected; "uuid 3.0.3" was `@sanity/uuid`'s version. Effective `minimumReleaseAge` is already 1440 min. | browserslist comes via `@babel/helper-compilation-targets` (through `next`, `@sanity/codegen`, Vite), not the icon picker. undici comes via `get-it` and `@ai-sdk/provider-utils`. pnpm 11 defaults `minimumReleaseAge` to 1440, so the exclude list is active. Renovate's Roboto preset also enforces a 7-day age. |
| AUD-009 | Nuance: Renovate already waits on every status check, including Vercel's commit status. | `:automergeRequireAllStatusChecks` plus `platformAutomerge: false` in the Roboto preset. The uncovered gap is drift (types, thumbnails), and the Vercel "soft failure" dashboard toggle, which nothing in the repo can detect. |
| AUD-057 | Raised low → medium. Scope widened. | Sanity's own help page lists `new Date().toISOString().slice(0, 10)` as the "Not recommended" example, character for character the repo's code. The code comment and CLAUDE.md misstate the docs. The Studio client and the deployed `auto-redirect` Function use the same constant. |
| AUD-059 | Narrowed. Drop `strict: true` from the fix. | Live test: Cyrillic and Arabic headings are transliterated, not blanked. Only scripts outside slugify's charmap (CJK and others) collapse to `""`, and `strict: true` does not change that. The index or hash fallback plus dedupe is the fix. |
| AUD-026 | "Twice more" → "once more". | React dedupes identical object references in the RSC payload; both TOCs receive the same array. |
| AUD-025 | Size understated. | `@tanstack/react-query` plus `query-core` is about 26 KB gzipped, not 12. |
| AUD-033 | Use `retry`, not `reset`. `global-error` gets no Tailwind theme. | Next 16.3.0 stabilised the `retry` prop. `global-error` renders outside the root layout, so `next-themes` and global CSS do not reach it. The in-repo `next-best-practices` skill example is stale. |
| AUD-044 | Low, not medium-low. | Google's Article structured-data doc lists no required properties and does not list `publisher` or `logo`. It is a dead-prop bug, not an SEO defect. |
| AUD-014 | Prefer the first-class `document.singletons` API. Needs Studio 6.17.0 or newer. | AUD-039's proposed bump to 6.16.0 would miss it; target 6.17.0. That API removes Duplicate but not Delete or Unpublish, so an `actions` filter is still needed. |
| AUD-008, AUD-030 | WCAG framing softened; severity kept on SEO grounds. | HTML permits multiple `<h1>`. The defensible citations are 1.3.1 (F43) for a mispositioned hero and 2.4.6 for the empty heading. A missing `<h1>` is an HTML "should", not a WCAG A/AA failure. |
| AUD-032 | "WCAG 2.4.1 failure" overstates it. Fix additions. | Landmarks (ARIA11) are a listed sufficient technique, so screen-reader users are arguably served. The skip link is for sighted keyboard users. Add `tabIndex={-1}` on `<main>` and `scroll-margin-top` for the sticky navbar. |
| AUD-036, AUD-061, AUD-070 (hero-blur) | Drop WCAG citations. | "Link Broken" maps to no criterion. Duplicate ids fail HTML's "must" but 4.1.1 was removed in WCAG 2.2. A scroll-driven blur is explicitly not "motion animation" under 2.3.3. |
| AUD-070 (footer heading contrast) | Pull out as its own low ticket. | Computed 4.47:1 at `/60`, a real 1.4.3 AA failure by 0.03. `/70` gives 6.18:1. |
| AUD-063 | Not a WCAG failure. | The Mux player's own pause control satisfies 2.2.2. It remains a Vercel-guideline gap. |
| AUD-020, AUD-021 | Fix must resolve with `new URL()`. | `/\evil.com` also passes a `startsWith("/")` check, and `sanitizeHref` has the same shortcut. See AUD-078. |
| AUD-066 | knip verdicts split. | `@sanity/functions`: false positive (functions are separate entrypoints). `react-is` in studio and packages/sanity: real. `tailwindcss` and `tw-animate-css` in `tailwind-config`: real, safe to remove because `packages/ui` declares both. |
| AUD-040 | Use `biome ci .`, and root `biome check .` fails today. | Biome's documented CI command is `biome ci`. Seven errors exist at the root right now (six `organizeImports`, one unformatted JSON). See AUD-076. |

## New findings from research

Eleven findings the first pass missed. Same format as `audit-findings.md`; full detail in the domain sections below.

| ID | Sev | Area | Title | Section |
|---|---|---|---|---|
| AUD-071 | low | a11y | Blog search result count not announced to assistive technology (4.1.3) | Accessibility |
| AUD-072 | low | perf | No `preconnect` for the Mux hosts the autoplaying hero loads from | Accessibility |
| AUD-073 | low | ui | `touch-action: manipulation` not set on interactive controls | Accessibility |
| AUD-074 | low | studio | `auto-redirect` uses the deprecated `publish` blueprint event | Sanity |
| AUD-075 | low | studio | Function handlers mutate real data during local testing (no `context.local` guard) | Sanity |
| AUD-076 | medium | CI | Root-level files outside every lint gate; `biome check .` already fails with 7 errors | CI and tooling |
| AUD-077 | low | tooling | No knip config; Sanity plugin unaware of `functions/**` and `migrations/**` | CI and tooling |
| AUD-078 | medium-low | security | Protocol-relative URLs (`//evil.com`, `/\evil.com`) pass both href allow-lists | Security |
| AUD-079 | low | security | Vercel's default HSTS lacks `includeSubDomains` and `preload` | Security |
| AUD-080 | medium | sanity | `sanityFetch` silently drops sync tags past the 128th per `cacheTag` call | Next.js and performance |
| AUD-081 | low | blocks | `SanityIcon` logs `console.error` in every visitor's browser for icon names removed in lucide v1 | Next.js and performance |

Updated totals across both files: 81 findings. 9 high, 30 medium, 42 low (after the re-ratings above).

## Sources that could not be reached

- `https://www.npmjs.com/package/slugify` returned 403 (README read from GitHub raw instead).
- `https://www.fusejs.io/api/indexing.html` returned 404; the quote comes from a search snippet.
- The Playwright `waitForTimeout` page truncated on fetch; wording confirmed through pages quoting it.
- No Vercel document states whether `Sec-Fetch-*` headers reach functions; inferred from MDN's "forbidden header" status and next-sanity's production code relying on it.
- No official page exists for Sanity's `document.unstable_fieldActions`; the installed type definitions were used.
- The WCAG glossary note on whether a platform-level setting counts as a "mechanism" was not returned by the fetch; flagged "verify" in AUD-029.

---

## Security findings: source backing

Scope: AUD-002, 010, 011, 012, 015, 020, 021, 039, 047, 051. Every claim was checked against the installed packages (next 16.3.3, next-sanity 13.3.3, react-dom 19.2.8, @sanity/preview-url-secret 4.1.5, sanity 6.11.0) and against the cited pages. Quotes are verbatim.

### Three technical questions settled first

**Does React 19 block `javascript:` in `href`?** Yes, by rewriting, not by throwing at render. Installed `react-dom@19.2.8` (`cjs/react-dom-client.production.js:1410-1416` and `cjs/react-dom-server.node.production.js:282-286`) contains `sanitizeURL(url)` which returns `"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"` when the URL matches a `javascript:` regex that tolerates leading control characters. The React 19 upgrade guide lists it as a breaking change: "Error for javascript URLs in `src` and `href` [#26507]" (https://react.dev/blog/2024/04/25/react-19-upgrade-guide). Only `javascript:` is covered; `data:`, `vbscript:` and other schemes pass through.

**Does next-sanity set the draft cookie `SameSite=None` in production?** Yes. Installed `next-sanity/dist/draft-mode/index.js:40-48`: `isSecure = isProduction || (options.secureDevMode ?? false)` then `cookieStore.set({ name: '__prerender_bypass', ..., secure: isSecure, sameSite: isSecure ? 'none' : 'lax', partitioned })`, where `partitioned = isSecure && sec-fetch-dest === 'iframe' && sec-fetch-site === 'cross-site'`. Next.js itself does the same in `next/dist/server/async-storage/draft-mode-provider.js:39,53`. Sanity's draft-mode guide confirms "HttpOnly," "Secure," and "SameSite=None" for iframe contexts and adds the CHIPS `Partitioned` attribute for cross-site iframes (https://www.sanity.io/docs/visual-editing/implementing-draft-mode). Nuance for AUD-010 and AUD-047: when the enable request came from a cross-site Presentation iframe in a CHIPS browser, the cookie is partitioned to the Studio's top-level site and is not sent to an attacker's frame or `<img>` (MDN: "Cookies marked `Partitioned` are double-keyed: by the origin that sets them and the origin of the top-level page"). It is unpartitioned, and therefore fully exposed, when Studio and site are same-site, when the preview was opened top-level, or in browsers without CHIPS (MDN Baseline: "Newly available since December 2025").

**Does `Sec-Fetch-Site` reach a Next.js route handler on Vercel?** No Vercel document lists it either way (https://vercel.com/docs/headers/request-headers enumerates only Vercel-added headers). Evidence it does: MDN says it is a "Forbidden request header" set by the browser and "Baseline: Widely available ... since March 2023" (https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site), and next-sanity's own production route handler branches on `sec-fetch-dest` and `sec-fetch-site` to decide CHIPS partitioning. Caveats: MDN says "The header is only included in requests to potentially trustworthy URLs" (HTTPS only), and OWASP says "Because some legacy browsers do not send `Sec-Fetch-*` headers, a fallback to standard origin verification headers is a mandatory requirement" (https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Usable, but pair it with an `Origin` check.

### AUD-002 Seed data ships live Presentation preview secrets

Verified in repo: `apps/studio/seed-data.tar.gz` → `data.ndjson` holds three `sanity.previewUrlSecret` documents with ids `drafts.<uuid>`, fields `secret` (43 chars), `source`, `studioUrl`, `userId`, `_updatedAt` 2026-02-12. No `sanity.previewUrlShareAccess` or `secrets.*` documents are in the export.

Sources:
- https://github.com/sanity-io/visual-editing/blob/main/packages/preview-url-secret/src/constants.ts (identical in installed `@sanity/preview-url-secret@4.1.5`): "updated within the hour, if it's older it'll create a new secret or return null ... export const SECRET_TTL = 60 * 60" and the query `*[_type == "sanity.previewUrlSecret" && secret == $secret && dateTime(_updatedAt) > dateTime(now()) - 3600][0]`. — confirms the 1-hour TTL keyed on `_updatedAt`; validation matches on `secret` only, `userId` is not checked.
- https://www.sanity.io/docs/visual-editing/implementing-draft-mode: "Secrets expire after one hour and are garbage-collected when new secrets are created." — confirms; adds that GC only runs when a new secret is created, so stale secrets stay in the dataset (and in any later export) until an editor opens Presentation.
- https://www.sanity.io/docs/content-lake/drafts-and-versions: "`_updatedAt` moves whenever a document is written to." — confirms that an import write re-stamps `_updatedAt`, which is what re-opens the window.
- https://www.sanity.io/docs/cli-reference/cli-datasets: export supports `--types=<value>` and `--no-drafts`. — supports the fix (`sanity dataset export --types <content types>` when regenerating the seed).
- Nuance: because the ids contain a dot, the documents are not readable by unauthenticated GROQ (https://www.sanity.io/docs/content-lake/ids), but that is irrelevant here since the secret values are in the public repo. The docs also carry the template author's Sanity `userId`, a minor privacy leak worth stripping.

Verdict: confirmed as written (high). The 1-hour window per import is exactly the library's documented behaviour.

### AUD-010 No security headers on the site

Sources:
- https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html: X-Frame-Options: "Use Content Security Policy (CSP) frame-ancestors directive if possible"; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin` ("we suggest forcing this behavior by sending this header on all responses"); Permissions-Policy: "Set it and disable all the features that your site does not need"; `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. — confirms the header list in the fix.
- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers: "**This header has been superseded by CSP's `frame-ancestors` option**" (about X-Frame-Options). https://nextjs.org/docs/app/guides/content-security-policy: "For applications that do not require nonces, you can set the CSP header directly in your `next.config.js`" and "**Partial Prerendering (PPR) is incompatible** with nonce-based CSP". — confirms the static `frame-ancestors`-only CSP in `headers()` is the right shape for this Cache Components app; a full nonce CSP would break its static shell.
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors: "`Content-Security-Policy: frame-ancestors 'self' https://www.example.org;`" and "This directive is not supported in the `<meta>` element." — confirms syntax; the value must be an HTTP header.
- https://vercel.com/docs/headers/response-headers: "The default value is `strict-transport-security: max-age=63072000` (2 years)". — confirms "HSTS comes only from Vercel"; nuance: Vercel's value lacks `includeSubDomains; preload` (see AUD-079).
- OWASP Clickjacking cheat sheet notes SameSite cookies are only defense in depth and `frame-ancestors` is the control.

Verdict: confirmed (medium), with the CHIPS nuance narrowing, not removing, the draft-session scenario. `frame-ancestors` fixes all cases.

### AUD-011 `/api/ask` can be abused to drain the AI budget

Sources:
- https://nextjs.org/docs/app/guides/backend-for-frontend: "Route Handlers are public HTTP endpoints. Any client can access them."; "Never trust incoming request data. Validate content type and size"; "In addition to code-based checks, enable any rate limiting features provided by your host."; "Some hosts deploy Route Handlers as lambda functions. This means: Route Handlers cannot share data between requests." — confirms the per-instance limiter problem and the Content-Type fix.
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html: reject unsafe methods "when `Sec-Fetch-Site: cross-site`", fallback to Origin verification "is a mandatory requirement"; requiring `application/json` rather than simple content types triggers CORS preflight. — confirms both the cross-site-POST vector and the fix.
- https://vercel.com/docs/headers/request-headers: "we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This restriction is in place to prevent IP spoofing." and "`x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel." — confirms `.at(-1)` is safe on Vercel and spoofable elsewhere.
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting: available on Hobby (1 rule) and Pro; "Rate limit counters are tracked on a per-region basis; traffic matching a given rate limit key in multiple regions can exceed the limit you configure for any single region." — nuance for the fix: a WAF rule is far better than the in-memory map but is per-region; a KV-backed limiter is the only truly global option.

Verdict: confirmed (medium). The "CORS-simple request" claim is correct: `Request.json()` ignores `Content-Type`, so a `text/plain` no-cors POST runs the whole pipeline.

### AUD-012 `secrets.mux` on a public dataset exposes Mux API credentials

Sources:
- https://www.sanity.io/docs/content-lake/ids: "All documents that contain a `.` in their _id can only be accessed when a user is logged in or a valid authentication token is provided for client and HTTP API calls (minimum `read` permission required)." — **contradicts the failure scenario**: an unauthenticated `*[_id=="secrets.mux"]` against a public dataset returns nothing.
- https://www.sanity.io/docs/content-lake/keeping-your-data-safe: "An unauthenticated request to a public dataset can only read documents whose `_id` contains no dot". Same contradiction; also "Never add an access token to JavaScript that is bundled for client-side use".
- https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-mux-input (README): "The token is stored in the dataset as a document of the type `mux.apiKey` with the id `secrets.mux`."; "Having the ID be non-root ensures that only editors are able to see it."; permissions "read and write _video_ and read _data_". — confirms storage; nuance: "only editors" is loose, any `read` token works.
- https://www.sanity.io/docs/http-reference/projects-api: `aclMode` "Defaults to public. Allowed values: `public`, `private`, `custom`." — confirms "public by default".
- https://www.sanity.io/docs/content-lake/the-vision-plugin: shows the `isDev` pattern to "only include the plugin in development mode". — supports the related `visionTool()` note.

Corrected threat model: the dataset ACL is not the gate for `secrets.mux`; possession of any read token is. In this repo that means (1) the Viewer token handed to every draft-mode browser via `browserToken` (AUD-051), (2) a draft session obtained with a leaked preview secret (AUD-002), (3) any project member with the Viewer role ("Read-only access to all datasets", https://www.sanity.io/docs/content-lake/roles), (4) Vision, which runs with the logged-in user's credentials. Making the dataset private is still right (it closes the unauthenticated surface for everything else), but it does not by itself protect `secrets.mux`.

Verdict: **contradicts as written**; keep the ticket but rewrite the scenario as "any read-token holder, including draft-mode browsers, can read Mux credentials" and re-rate to medium-low. Add "scope `SANITY_API_READ_TOKEN` to Viewer and set `browserToken: false`" (AUD-051) as the more effective control. Both READMEs (`README.md:125-129`, `apps/studio/README.md:29-31`) state the wrong threat model and should be corrected.

### AUD-015 Unauthenticated server action can evict the whole cache

Verified: installed `next-sanity/dist/parseTags.js:23-37` checks only array, non-empty, strings, `startsWith("sanity:")`; no length limit. `next-sanity/dist/SanityLive.js:57` calls `action(event.tags.map(tag => "sanity:" + tag))` in the browser on every `message` event.

Sources:
- https://nextjs.org/docs/app/guides/data-security: "By default, when a Server Action is created and exported, it is reachable via a direct POST request, not just through your application's UI."; "For expensive operations ... consider adding rate limiting". — confirms public reachability.
- https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions: "Next.js compares the host in a request's `Origin` header against the app's own host ... A request that carries no `Origin` header at all is allowed through with a warning rather than rejected." (matches installed `next/dist/server/app-render/action-handler.js:442-445`). — nuance: Next's CSRF check stops cross-site browser calls, but a scripted POST with no `Origin` (or a forged matching one) passes, so the "anyone loops the action" scenario is real for scripts, not for third-party pages.
- https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md: the action is "called with tags from the browser on live events"; the documented example is exactly `parseTags(unsafeTags)` + `revalidateTag` + `return 'refresh'`. — confirms this is the vendor pattern.
- https://www.sanity.io/docs/help/nextjs-16-sanitylive-status: `revalidateTag(tag, { expire: 0 })` "nukes the Next.js client-side cache"; "Clearing the client cache empties the prefetch cache. Next.js sees the visible Link tags and prefetches them all again"; a revalidated prefetch "performs a data fetch (counts toward Sanity API usage) and triggers an ISR write". — confirms the cost consequence and suggests `revalidateTag(tag, "max")` or draft-only `<SanityLive>` as mitigations.

Verdict: confirmed (medium), with the Origin-check nuance (cross-site pages cannot drive it; scripts can).

### AUD-020 Redirects: build/runtime matchers diverge, destinations not origin-checked

Node check: `new URL("//evil.com/login", "https://site.example/")` → `https://evil.com/login`; `/\evil.com` → `https://evil.com/`.

Sources:
- https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects: `source` uses path-to-regexp; "The following characters `(`, `)`, `{`, `}`, `:`, `*`, `+`, `?` are used for regex path matching, so when used in the `source` as non-special values they must be escaped"; `destination` may be an absolute URL. — confirms an unescaped `/old(` breaks the build and that external destinations are honoured.
- https://url.spec.whatwg.org/#special-relative-or-authority-state: "If c is U+002F (/) and remaining starts with U+002F (/), then set state to special authority ignore slashes state" — `//host` is an authority, so `startsWith("/")` does not prove same-origin. — confirms the `//evil.com` bypass.
- https://nextjs.org/docs/app/guides/backend-for-frontend (callback URL example): "Prevent open redirects: only allow same-origin destinations" via `new URL(redirectUrl, request.url)` and `destination.origin !== request.nextUrl.origin`. — confirms the audit's proposed fix is the official pattern.
- https://community.owasp.org/attacks/open_redirect: recommends "parse the URL with a standard library and compare the hostname against a strict allowlist of trusted domains". — confirms.

Verdict: confirmed (medium). `/\evil.com` also passes the Studio check, so the fix must resolve with `new URL()` rather than add `!startsWith("//")`.

### AUD-021 Editor-supplied hrefs bypass `sanitizeHref` in the app shell and FAQ

Sources:
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html: for "Untrusted URL in a SRC or HREF attribute": "Allow-list http and HTTPS URLs only (Avoid the JavaScript Protocol to Open a new Window)"; React "cannot handle `javascript:` or `data:` URLs without specialized validation". — confirms the defense-in-depth need.
- React 19 behaviour: installed react-dom `sanitizeURL` and PR #26507 (above). — confirms "React 19 neutralizes `javascript:`" and that only `javascript:` is covered.
- Nuance: the same leading-slash shortcut in `sanitizeHref` (`packages/sanity-blocks/src/internal/safe-href.ts:4`) accepts `//evil.com`, so wrapping in `sanitizeHref` alone will not stop protocol-relative externals (see AUD-078).

Verdict: confirmed (medium, defense in depth).

### AUD-039 Dependency audit: 9 advisories, all transitive

Installed versions from `pnpm-lock.yaml`: smol-toml 1.5.2 and 1.6.1; adm-zip 0.6.0; browserslist 4.28.2; baseline-browser-mapping 2.10.32; uuid 10.0.0 and 11.1.0 (the "3.0.3" in the first report's table is `@sanity/uuid`'s version, not `uuid`'s); undici 6.28.1 and 7.29.0.

| Advisory | Package / CVE | CVSS | Affected → patched | Reachable from `next build`? | From Studio build? | Notes |
|---|---|---|---|---|---|---|
| GHSA-7w5x-hrqm-74c2 | smol-toml / CVE-2026-85730 | 8.2 (v4.0) high | <=1.7.0 → 1.7.1 | No | No (CLI only) | "`parse()` function enters an infinite loop when processing values within arrays or inline tables followed by comments without trailing newlines". Reached via `@vercel/frameworks` parsing `.toml` config files on disk during `@sanity/cli` framework detection. Input is the developer's own repo files. |
| GHSA-v3rj-xjv7-4jmq | smol-toml | 5.3 moderate | <1.6.1 → 1.6.1 | No | No | Recursion over "thousands of consecutive commented lines". Only the 1.5.2 copy is affected. |
| GHSA-vwc7-r8mq-g2x9 | adm-zip / CVE-2026-76845 | 6.8 (v4.0, AV:L) moderate | >=0.5.9 <=0.6.0 | No | No (CLI only) | `extractAllTo` "use `fs.openSync(path, "w", 0o666)` which resolves symbolic links". Pulled by `@sanity/runtime-cli` and `@module-federation/dts-plugin` via `@sanity/workbench-cli`. GH page says "Patched versions: None"; treat 0.6.1 as the fix. |
| GHSA-7q85-xj36-vmfc | adm-zip / CVE-2026-77301 | 7.5 high | <0.6.1 → 0.6.1 | No | No (CLI only) | "`Buffer.alloc(<declared uncompressed size>)` before checking the declared size" in `getData()`. This is the "high" the first report attributed to adm-zip. |
| GHSA-c83g-rgw3-j3cx | browserslist / CVE-2026-73089 | 7.5 high | <=4.28.6 → 4.28.7 | Build-time only, not attacker-influenced | Same | "Every distinct `(queries, context)` pair is cached forever". **Provenance correction**: pulled by `@babel/helper-compilation-targets` (via `@babel/core` → `@sanity/codegen`, `@sanity/cli-build`, `@vitejs/plugin-react`, and `styled-jsx` → `next`), not specifically by lucide-icon-picker. |
| GHSA-73wf-gq98-2v4g | browserslist / CVE-2026-73088 | 7.5 high | <=4.28.6 → 4.28.7 | Build-time only | Same | Crash via an untrusted auto-discovered `browserslist-stats.json`; none in this repo. |
| GHSA-w5vr-8v7q-w6rv | baseline-browser-mapping / CVE-2026-45819 | 6.6 (v4.0) moderate | >=2.0.0 <2.11.0 → 2.11.0 | Build-time only | Same | "calls process.exit() instead of throwing on invalid or conflicting input parameters". Pulled by browserslist and directly by `next@16.3.3`. |
| GHSA-w5hq-g745-h8pq | uuid / CVE-2026-41907 | 6.3 (v4.0) moderate | <11.1.1 → 11.1.1 | No | No | Only `v3()/v5()/v6()` "when `buf` is provided". `@sanity/uuid` re-exports `v4`; `typeid-js` uses `v7`. Not called. |
| GHSA-3wwx-pv8p-q78v | undici / CVE-2026-85024 | 5.9 moderate | >=7.28.0 <7.29.1 → 7.29.1 | Runtime dependency, vulnerable path not used | n/a | WebSocket `permessage-deflate` client path. `get-it` (Sanity client) and `@ai-sdk/provider-utils` import `Agent`/`fetch`, never `WebSocket`. **Provenance correction**: pulled by `get-it`, `@ai-sdk/provider-utils` and `@module-federation`, not by lucide-icon-picker. |

Sources: the advisory pages above (https://github.com/advisories/<id>); https://pnpm.io/settings/dependency-resolution ("minimumReleaseAge ... default value of 1440 minutes (since v11)").

Verdict: confirmed on substance (none reachable at runtime; CLI and build tooling only), with two "pulled in by" cells corrected (browserslist and undici) and the adm-zip high advisory identified as GHSA-7q85-xj36-vmfc. pnpm 11 already applies `minimumReleaseAge` = 1440 by default, so the `minimumReleaseAgeExclude` list is active; setting the key explicitly is still reasonable documentation.

### AUD-047 Unreferenced `/api/disable-draft` route with a CSRF-able side effect

Sources:
- https://nextjs.org/docs/app/guides/draft-mode: "`GET` is meant to be a safe, read-only method. Operations that affect future requests, like enabling Draft Mode via a cookie, should use `POST`." and "Exiting Draft Mode also works with a `GET` Route Handler, but a `POST` is semantically more correct, for example via a form submitted through a Server Action". — confirms; the repo's server action is the documented shape, so the route is redundant.
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html: "Do not use GET requests for state changing operations." — confirms.
- MDN Set-Cookie: `SameSite=None` "Send the cookie with both cross-site and same-site requests." — confirms the `<img src>` vector for unpartitioned cookies.

Verdict: confirmed (low), same CHIPS caveat as AUD-010. Deleting the route is the cleanest fix.

### AUD-051 Viewer token delivered to draft-mode browsers

Verified in installed `next-sanity/dist/live/conditions/react-server/index.js:71,82`: `includeDrafts = typeof browserToken === "string" && !!browserToken && (_includeDrafts ?? (await draftMode()).isEnabled)` and `token: includeDrafts ? browserToken : void 0`; the repo passes `includeDrafts={isDraftMode}`. The same token is `serverToken` and the `presentation-draft` client token.

Sources:
- https://reference.sanity.io/next-sanity/live/conditions/default/DefineLiveOptions/: browserToken is "Token shared with the browser when `<SanityLive includeDrafts />` opens a draft-capable live connection. Use a browser-safe token with the minimum read permissions needed for live previewing drafts outside Presentation Tool." — confirms; nuance: the token exists to support stand-alone (non-Presentation) draft previews, which this template does not use.
- next-sanity dev warning (installed `dist/live/conditions/*/index.js:14-15`): "It is shared with the browser so it should only have Viewer rights or lower. You can silence this warning by setting `browserToken: false`." — confirms the fix is a supported configuration.
- https://www.sanity.io/learn/course/visual-editing-with-next-js/token-handling-and-security: "It is your responsibility to secure this token. Unencrypted access could allow a user to read any document from any dataset in your project." — confirms the blast radius (dataset-wide, including `secrets.mux` and drafts).

Verdict: confirmed. Low as a standalone item, but it is the actual gate for AUD-012 and the payoff for AUD-002; raise to medium and fix first.

### New findings from security research

#### AUD-078 Protocol-relative URLs pass both the Studio and the frontend href allow-lists

- Severity: medium-low. Area: studio, sanity-blocks, security. Confidence: high (reproduced in Node).
- Files: `apps/studio/utils/helper.ts:3-14` (`isRelativeUrl` → `startsWith("/")`), `packages/sanity-blocks/src/internal/safe-href.ts:4` (`href.startsWith("/") || href.startsWith("#")` short-circuits before the protocol check), `apps/studio/schemaTypes/documents/redirect.ts:101`.
- Problem: `new URL("//evil.com")` throws without a base, so `isValidUrl` falls back to `isRelativeUrl`, which accepts it; `sanitizeHref` accepts it outright. `//evil.com/login` and `/\evil.com` return `true` from both validators and resolve to `https://evil.com/...` against the site origin. The `sanitizeHref` wrapper that AUD-021 proposes therefore still lets an editor (or a compromised token) point any button, nav item or rich-text link at an external host while it looks internal, with `target="_self"` and no `rel="noopener"`. Not script execution, but it defeats the allow-list's purpose and turns the site into an open-redirect surface for phishing links.
- Fix: resolve with `new URL(href, base)` and accept only when `origin === base.origin` or the protocol is in the allow-list; drop the `startsWith("/")` shortcut in both helpers (the repo's own `internalPathOnly` already does it correctly). Same change for the redirect destination validator (AUD-020).
- Source: https://url.spec.whatwg.org/#special-relative-or-authority-state; https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html ("Canonicalize input, URL Validation, Safe URL verification, Allow-list http and HTTPS URLs only").

#### AUD-079 Vercel's default HSTS lacks `includeSubDomains` and `preload`

- Severity: low. Area: web, security.
- Files: `apps/web/next.config.ts` (no `headers()`).
- Problem: Vercel sends `strict-transport-security: max-age=63072000` only. OWASP recommends `max-age=63072000; includeSubDomains; preload`. Without `includeSubDomains`, a plain-HTTP subdomain (for example a self-hosted Studio or a staging host) can still be used to set cookies for the registrable domain or to downgrade a first visit.
- Fix: when AUD-010's `headers()` is added, include `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Next.js documents this exact value) once every subdomain is HTTPS.
- Source: https://vercel.com/docs/headers/response-headers; https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html; https://nextjs.org/docs/app/api-reference/config/next-config-js/headers.

Not found: no Vercel document states whether `Sec-Fetch-*` headers are forwarded to functions; the OWASP Unvalidated Redirects cheat sheet does not explicitly mention protocol-relative URLs (the WHATWG URL Standard was used instead).

---

## Next.js and performance findings: source backing

Scope: AUD-001, 006, 007, 016, 017, 023 to 028, 033, 043, 045, 046, 049, 064, 065. Read the three local skill docs (`.claude/skills/next-cache-components/SKILL.md`, `.claude/skills/vercel-react-best-practices/` with `rules/*.md`, `.claude/skills/next-best-practices/`), the cited source files, and the installed package sources (Next 16.3.3, sanity-image 1.2.0, lucide-react 1.47.0, next-sanity 13.3.3). External URLs were fetched except where marked as coming from a search snippet.

### AUD-001 Production build fails when the GitHub API rate-limits the stars fetch

Sources:
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api — "The primary rate limit for unauthenticated requests is 60 requests per hour." / "If you exceed your primary rate limit, you will receive a `403` or `429` response, and the `x-ratelimit-remaining` header will be `0`." / authenticated: "All of these requests count towards your personal rate limit of 5,000 requests per hour." — confirms the 403 cause and the `GITHUB_TOKEN` fix.
- https://nextjs.org/docs/app/api-reference/directives/use-cache — "With Cache Components, prerendering fills the entry and keeps rendering, so this output contributes to the route's static shell" and "Nesting a short-lived use cache inside one without an explicit cacheLife fails the build during prerendering." — adds nuance: the "return `null` with a short `cacheLife`" fix is safe only because `fetchGithubStars` is called from an uncached caller; if it is ever moved inside another `use cache` scope without an explicit `cacheLife`, the short profile itself becomes a build error.
- https://nextjs.org/docs/app/guides/building — "Rerun the build with `--debug-prerender` ... This helps with any error thrown during prerendering, not only blocking ones." — adds nuance: use this to get the user-frame stack for the 403 path.
- Next.js source `dist/server/use-cache/use-cache-wrapper.js:822-832` — the cache scope's `onError` is `createReactServerErrorHandler(..., workStore.isBuildTimePrerendering, ...)` whose callback does `if (process.env.NODE_ENV === 'production') { _log.error(error); } errors.push(error);` — confirms why `Error: GitHub stars request failed with 403` is printed during `next build` even though `getGithubStars` catches.
- Same package, `dist/server/app-render/create-error-handler.js:84-86` — comment: "This error crossed a react-server boundary (e.g. from a `'use cache'` render). Reaching the handler means it surfaced (it wasn't caught in userland)". And `dist/server/resume-data-cache/cache-store.js` `serializeUseCacheCacheStore(...).catch(() => { // Any failed cache writes should be ignored as to not discard the entire cache. })` — partially contradicts the first report's stated mechanism: Next's own code treats a cache-scope error that userland catches as not surfaced, and failed cache writes are dropped. No Next.js doc or GitHub issue was found stating that an error caught by the caller of a `"use cache"` function still fails `next build`.
- Same package, `dist/export/worker.js:313-316` — `if (nextConfig.experimental.prerenderEarlyExit) { console.error(\`Export encountered an error on ${pageKey}, exiting the build.\`); process.exit(1); }` with `prerenderEarlyExit: true` default — confirms why the first failing page aborts the whole export.
- `process.env.NEXT_PHASE`: Next source `dist/build/index.js:1212` sets `process.env.NEXT_PHASE = PHASE_PRODUCTION_BUILD`; https://github.com/vercel/next.js/discussions/48736 (collaborator): "There's an ENV var that signals the build time. It is called: `process.env.NEXT_PHASE` and it will be set to `phase-production-build` during build time." — adds nuance: it works and `next/constants` is public, but official docs only document the phase argument for `next.config.js`; `NEXT_PHASE` in app code is undocumented. Also https://nextjs.org/docs/app/getting-started/caching: "Bots and crawlers ... Next.js skips the shell and renders the entire page dynamically at request time", so a build-only skip still leaves unauthenticated runtime calls for crawlers and revalidations.

Verdict: confirmed symptom and cause (60 requests per hour per IP → 403). The CI log for run 36609421574 is empirical proof the export aborts. The exact propagation mechanism (whether the userland `catch` in `getGithubStars` should have prevented it) is not backed by docs and is contradicted by Next's own error-handler comment. Reproduce with `next build --debug-prerender` before the ticket asserts a mechanism. The fix direction is correct either way: never throw inside the cache scope, send `GITHUB_TOKEN` when available, unit-test the 403 path. `NEXT_PHASE` is usable but undocumented for app code.

### AUD-006 Whole page builder is a Client Component

Sources:
- https://react.dev/reference/rsc/use-client — "the `'use client'` directive in `InspirationGenerator.js` marks that module and all of its transitive dependencies as Client modules." / "Prop values passed from a Server Component to Client Component must be serializable." — confirms.
- https://nextjs.org/docs/app/getting-started/server-and-client-components — "Once a file is marked with `"use client"`, **all of its imports and the components it directly renders are included in the client bundle**." / "To reduce the size of your client JavaScript bundles, add `'use client'` to specific interactive components instead of marking large parts of your UI as Client Components." / RSC payload contains "Any props passed from a Server Component to a Client Component" / "You can pass Server Components as a prop to a Client Component." — confirms bundle claim and slot-composition fix.
- https://www.sanity.io/docs/visual-editing/useoptimistic-reference — `'use client'` "must be declared at the top of the component file using this hook" and "Outside the Presentation Tool, `useOptimistic` is a no-op and always returns the passthrough value." — confirms the hook is the only reason for the boundary and that mounting reorder logic only in draft mode loses nothing for visitors.
- Local `rules/server-serialization.md`, `next-best-practices/rsc-boundaries.md` — confirms.

Verdict: confirmed. "Roughly doubling the RSC payload" is plausible but unmeasured; label as an estimate.

### AUD-007 LCP hero image is invisible until hydration

Sources:
- https://raw.githubusercontent.com/coreyward/sanity-image/main/src/SanityImage.tsx — `const ImageComponent = preview && !isSvg ? ImageWithPreview : (component ?? "img")` — confirms omitting `preview` yields a plain `<img>`.
- https://raw.githubusercontent.com/coreyward/sanity-image/main/src/ImageWithPreview.tsx — `baseStyles = { height: "10px", width: "10px", position: "absolute", zIndex: -10, opacity: 0, ... }`, `const onLoad = () => { setLoaded(true) }`, `useEffect(() => { if (ref.current?.complete) { onLoad() } }, [])` — confirms (same code in installed `sanity-image@1.2.0`). Nuance: the `complete` check reveals an already-loaded image at hydration, so LCP = max(image load, hydration), as the audit says.
- https://web.dev/articles/optimize-lcp — "Never lazy-load your LCP image, as that will always lead to unnecessary resource load delay" / "The goal in this step is to ensure the LCP element can render immediately after its resource has finished loading, no matter when that happens." / "Preload the LCP image with a high fetchpriority so it starts loading with the stylesheet." — confirms the render-delay framing and `preload` suggestion.
- https://web.dev/articles/fetch-priority — "By tagging important images in markup using `fetchpriority="high"`, they can start at 'High' immediately and load much faster." — adds nuance: the download already starts early (real `<img src srcSet>` is in the HTML); only the paint is deferred.

Verdict: confirmed.

### AUD-016 `sanityFetch` throws outside a `"use cache"` scope

Sources:
- Next source `dist/server/use-cache/cache-tag.js:22-39` — `case 'prerender': ... case 'request': case 'unstable-cache': case 'generate-static-params': case undefined: throw new Error('\`cacheTag()\` can only be called inside a "use cache" function.')` (E819); only `'cache'`/`'private-cache'` pass — confirms it throws in Server Components, route handlers, `generateMetadata`, actions, `generateStaticParams`.
- https://nextjs.org/docs/app/api-reference/functions/cacheTag — "Tag your cached data by calling `cacheTag` within a cached function or component." — confirms the precondition (docs do not say it throws; source does).

Verdict: confirmed. See also AUD-080 (128-tag cap) discovered on the same doc page.

### AUD-017 Markdown links absolutize against the wrong origin

Sources:
- https://vercel.com/docs/environment-variables/system-environment-variables — `VERCEL_PROJECT_PRODUCTION_URL`: "Note, that this is always set, even in preview deployments. This is useful to reliably generate links that point to production such as OG-image URLs. The value does not include the protocol scheme https://." / `VERCEL_URL`: "The domain name of the generated deployment URL." — confirms preview `.md` links point at production and off-Vercel the var is absent.

Verdict: confirmed.

### AUD-023 `SanityIcon` renders a warning triangle on the server, then fetches one chunk per icon

Sources:
- https://lucide.dev/guide/react/advanced/dynamic-icon-component — "It is possible to use one generic icon component to load icons. But it is not recommended, since it is importing all icons during the build." Caveats: "The bundler will create a separate module for each icon, which can increase the number of network requests." / "You can encounter flashing when loading the icon, since the icon is loaded dynamically." / "When using server-side rendering, you need to make sure that the icon is available during the initial render." — confirms all three symptoms.
- lucide source `lucide-react@1.47.0/dist/esm/DynamicIcon.mjs` — `"use client"`, `useState`, `useEffect(() => { getIconData(name).then(setIconData).catch((error) => { console.error(error); }); }, [name]);`, `if (iconData == null) { ... return createElement(Fallback); }` — confirms the fallback is what SSR emits. Nuance: unknown names (icons removed in lucide v1) `console.error` in every visitor's browser and show the triangle permanently (see AUD-081); `dynamicIconImports` has 4,224 entries.

Verdict: confirmed.

### AUD-024 `"use client"` placed too high inside blocks

Sources:
- https://nextjs.org/docs/app/getting-started/server-and-client-components — "add `'use client'` to specific interactive components instead of marking large parts of your UI as Client Components." plus the `children` slot pattern — confirms.
- https://react.dev/reference/react-dom/hooks/useFormStatus — "The `useFormStatus` Hook must be called from a component that is rendered inside a `<form>`." / "`useFormStatus` will not return status information for a `<form>` rendered in the same component." — confirms the button must be its own component anyway, so splitting the file is free.

Verdict: confirmed.

### AUD-025 React Query provider in the root layout for one feature

Sources:
- https://bundlephobia.com/api/size?package=@tanstack/react-query@5.102.8&record=true — `gzip: 13,782` bytes (minified 50,712). https://bundlephobia.com/api/size?package=@tanstack/query-core@5.102.5&record=true — `gzip: 12,019` bytes. — adds nuance: the pair is about 26 KB gzipped before tree-shaking, about double the first report's "about 12 KB".
- https://nextjs.org/docs/app/getting-started/server-and-client-components — "You should render providers as deep as possible in the tree" — confirms moving the provider to `blog-search-layout.tsx`.

Verdict: confirmed; size understated (about 26 KB gzip).

### AUD-026 Both tables of contents receive the full Portable Text body as client props

Sources:
- https://nextjs.org/docs/app/getting-started/server-and-client-components — RSC payload contains "Any props passed from a Server Component to a Client Component"; "Props passed to Client Components need to be serializable" — confirms the body is serialized.
- Local `rules/server-dedup-props.md` — "RSC→client serialization deduplicates by object reference, not value. Same reference = serialized once" — adds nuance: `blog/[slug]/page.tsx:214-219,228-232` pass `richText ?? []`, the same array reference, to both TOCs, so the body is serialized once for the client (plus the server `RichText` HTML), not "twice more".

Verdict: confirmed in substance; "twice more" should read "once more" (React dedupes identical references).

### AUD-027 Proxy matcher runs on every static asset

Sources:
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy — "Without a `matcher`, Proxy runs on **every request**, including static files (`_next/static`), image optimizations (`_next/image`), and assets in the `public/` folder." / recommended negative matcher `'/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'` and extension example `'/((?!api|_next/static|_next/image|.*\\.png$).*)'` — confirms `favicon.*`, `/static/**` and other `public/` files are matched today.
- https://vercel.com/docs/routing-middleware — "Routing Middleware is priced using the fluid compute model"; https://vercel.com/docs/functions/usage-and-pricing — Invocations: "Counts each request to your function", "Billed per incoming request". — confirms billing.
- Nuance from the proxy doc: "Even when `_next/data` is excluded in a negative matcher pattern, proxy will still be invoked for `_next/data` routes."

Verdict: confirmed. Keep `.md` matched.

### AUD-028 Sticky navbar stacks six backdrop-filter layers

Sources:
- https://web.dev/articles/backdrop-filter — "Caution: `backdrop-filter` may harm performance. Test it before deploying." — confirms direction, unquantified.
- https://webkit.org/blog/3632/introducing-backdrop-filters/ — "However, be warned! The nature of this backdrop effect forces the engine to perform more rendering passes, which will have an impact on performance." / "Make sure you only use this feature where it is most necessary." — confirms direction.
- No source quantifies stacked-layer cost; "re-rasterized every scroll frame" stays unmeasured.

Verdict: confirmed as a risk; keep "verify with DevTools" first.

### AUD-033 No `error.tsx` or `global-error.tsx`

Sources:
- https://nextjs.org/docs/app/api-reference/file-conventions/error — "`error.js` wraps a route segment and its nested children in a React Error Boundary." / "Errors forwarded from Server Components show a generic message with an identifier." / "Global error UI must define its own `<html>` and `<body>` tags ... This file replaces the root layout or template when active." / "`global-error` and the built-in 500 page render their own document and do **not** include your global styles, so an app-level theme toggle ... won't reach them." — confirms.
- Same page: "`v16.3.0` `retry` prop became stable." / "In most cases, you should use `retry()` instead" [of `reset()`] — adds nuance: on 16.3.3 the fix should use `retry`, not `reset`. The local skill `next-best-practices/error-handling.md` still shows `reset` and is stale against 16.3.

Verdict: confirmed. Refinement: implement `error.tsx` with `retry`; give `global-error.tsx` inline styles plus `prefers-color-scheme` because Tailwind globals and the `next-themes` class do not reach it; update the skill example.

### AUD-043 `generateMetadata` refetches the full page into a second cache entry and waterfalls settings

Sources:
- https://nextjs.org/docs/app/api-reference/directives/use-cache — cache key = "Build ID ... Function ID - A secure hash of the function's location and signature ... Serializable arguments" — confirms `sanityFetchMetadata` and `getPublishedSlugPage` store separate entries for the same document.
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata — "`fetch` requests inside `generateMetadata` are automatically memoized for the same data across `generateMetadata`, `generateStaticParams`, Layouts, Pages, and Server Components." — adds nuance: memoization is per-request and `fetch`-only; it does not dedupe two distinct `use cache` scopes.

Verdict: confirmed.

### AUD-045 Home and slug pages flash blank on every Presentation navigation

Sources:
- https://nextjs.org/docs/app/api-reference/directives/use-cache — "When Draft Mode is enabled, all cached functions and components re-execute on every request, and results are not saved to the cache." — confirms the blog page's comment.
- https://nextjs.org/docs/app/getting-started/caching — "The fallback ships with the prerendered shell while the async work runs at request time." — confirms `Suspense fallback={null}` around a draft-only branch always paints blank first.

Verdict: confirmed.

### AUD-046 `SanityLive` mounts for every anonymous visitor

Sources:
- https://bundlephobia.com/api/size?package=@sanity/client@7.27.0&record=true — `gzip: 29,592` bytes (minified 96,246) — confirms "20 to 30 KB gzipped" (upper end).
- next-sanity typings `dist/types.d.ts:245-251` — `browserToken`: "Token shared with the browser when `<SanityLive includeDrafts />` opens a draft-capable live connection." `serverToken`: "This token is never shared with the browser unless you also pass it as `browserToken`." — adds nuance: the same Viewer token is reused as `browserToken` (AUD-051); `false` is the typed opt-out.
- https://www.sanity.io/docs/developer-guides/live-content-guide — "The `browserToken` is only used when Draft Mode is enabled and initiated by Presentation Tool or Vercel Toolbar." / in v13 "a published change is *eventually consistent* — some connected visitors may need to navigate or refresh before they see it" / pair `<SanityLive>` "with a Sync Tag Invalidate Function and set `waitFor="function"`". https://www.sanity.io/docs/nextjs/cache-components — "Render `<SanityLive />` once in a root layout and pass `includeDrafts={isDraftMode}`." — adds nuance: Sanity's documented default is to mount it for all visitors; dropping it for anonymous traffic is an explicit departure, and the Function path is the invalidate-tags Function this repo ships (AUD-003).

Verdict: confirmed as a design trade, correctly labelled by the audit.

### AUD-049 `/api/blog/search` has no query length cap and rebuilds the Fuse index per request

Sources:
- Fuse.js Indexing docs (https://www.fusejs.io/api/indexing.html returned 404 to the fetcher; quote is from the search-result snippet, unverified against the live page): "Pre-generate the index from the list, and pass it directly into the Fuse instance. If the list is (considerably) large, it speeds up instantiation." — confirms the memoized-index fix.
- No authoritative source for a query-length cap; ordinary input validation.

Verdict: confirmed (index); length cap unsourced but uncontroversial.

### AUD-064 Per-image `<noscript>` duplicates the full srcset

Sources:
- Installed sanity-image README — "By default it renders an `img` tag (two if you pass in a `preview`)" — adds nuance: the library emits two `<img>`; the `<noscript>` third copy is this repo's own `NoScriptFallback` (`packages/sanity-blocks/src/internal/sanity-image.tsx:153-205`), so the fix is local.
- No authoritative source quantifies `<noscript>` srcset cost; 40 to 60 KB is the audit's arithmetic, unmeasured.

Verdict: plausible, unsourced; low.

### AUD-065 Small React and DOM inefficiencies

Sources:
- https://gist.github.com/paulirish/5d52fb081b3570c81e3a — `getBoundingClientRect()` listed under "Getting box metrics"; "Batch your writes & reads to the DOM ... Read your metrics at the beginning of the frame ... when the numbers are still identical to the last time layout was done." — confirms the navbar item (`navbar.tsx:171-176` reads `el.getBoundingClientRect()` then writes via `applyContrast` in the same loop).
- Local `rules/rerender-derived-state-no-effect.md` (references https://react.dev/learn/you-might-not-need-an-effect) — confirms the `table-of-content.tsx:583-587` item.
- https://nextjs.org/docs/app/api-reference/components/image — `loading`: "Use `eager` only when you want to ensure the image is loaded immediately." — confirms the logo item. Note `Logo` uses `SanityImage`, not `next/image`, so the Next 16 `priority`→`preload` deprecation does not apply.

Verdict: confirmed.

### AUD-050 `/blog.md` fetches every post with images and authors to print title and slug

No external source applies; this is a repo-internal over-fetch confirmed by reading `apps/web/src/app/api/markdown/route.ts:62-69` against `querySitemapData.blogPages`, which `llms.txt` already uses for the same output. Verdict: confirmed (low).

### New findings from Next.js research

#### AUD-080 `sanityFetch` can silently drop sync tags past the 128th

- Severity: medium (latent stale cache). Area: sanity. Confidence: high on the limit, medium on frequency.
- Files: `packages/sanity/src/live.ts:56-58` (`if (result.tags.length > 0) { cacheTag(...result.tags); }`)
- Problem: all sync tags go into one `cacheTag()` call; Next caps a single call at 128 tags and drops the rest with only a console warning. Page-builder pages reference many documents, so large pages can exceed 128.
- Scenario: an editor publishes a document whose tag was past the 128th; the webhook fires, but the entry never carried that tag, so the page stays stale until `revalidate` elapses.
- Fix: chunk `result.tags` into groups of 128 and call `cacheTag` per chunk (multiple calls are allowed and idempotent); log via `@workspace/logger` when chunking.
- Source: https://nextjs.org/docs/app/api-reference/functions/cacheTag — "A single `cacheTag()` call accepts up to 128 tags, each with a maximum length of 256 characters. Tags longer than 256 characters are skipped, and any tags past the 128th in one call are dropped. Both cases log a console warning." / "**Idempotent Tags**: Applying the same tag multiple times has no additional effect."

#### AUD-081 `SanityIcon` logs a `console.error` in every visitor's browser for unknown icon names

- Severity: low (ties to AUD-023 and AUD-068). Area: sanity-blocks.
- Files: `packages/sanity-blocks/src/internal/sanity-icon.tsx:26-35`; lucide `dist/esm/DynamicIcon.mjs`.
- Problem: `DynamicIcon` does `getIconData(name).then(setIconData).catch((error) => { console.error(error); })`; a name removed in lucide v1 throws `"[lucide-react]: Name in Lucide DynamicIcon not found"` on every page view and leaves the triangle fallback permanently. Tests miss it because the lucide mock accepts any name.
- Fix: validate `icon` against `iconNames` (exported from `lucide-react/dynamic`) on the server and render nothing or a neutral span for unknown names; add a test that every icon name in seed content exists in `iconNames`.
- Source: installed `DynamicIcon.mjs` (quoted above) and https://lucide.dev/guide/react/advanced/dynamic-icon-component — "When using server-side rendering, you need to make sure that the icon is available during the initial render."

---

## Accessibility findings: normative backing

Scope: AUD-008, 029, 030, 031, 032, 034, 035, 036, 061, 062, 063, 070. Every quote below is verbatim from a page fetched during research. WebAIM's HTML checker returned 403 to the fetcher, so its JSON API was queried with curl instead; the ratios were also independently computed from the oklch tokens in `packages/ui/src/styles/globals.css`. Where a page did not contain the sentence being looked for, that is stated rather than paraphrased from memory. Vercel Web Interface Guidelines rules are quoted by line number from `command.md` in the vercel-labs/web-interface-guidelines repository.

### AUD-008 Hero renders a hard-coded `<h1>` regardless of position, and emits it empty

Code check: `packages/sanity-blocks/src/hero/index.tsx:158-163` renders `<h1>{title}</h1>` unconditionally, in both the `isFirst` and `!isFirst` branches; `hero-split/index.tsx:24` already does `const Heading = isFirst ? "h1" : "h2"` and guards on `title`. Confirmed.

Sources:
- https://www.w3.org/TR/WCAG22/#info-and-relationships — SC 1.3.1 Info and Relationships (Level A): "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text." — confirms (a second hero's title is visually a section heading but is exposed as a page-level heading).
- https://www.w3.org/WAI/WCAG22/Techniques/html/H42 — H42 "Using h1-h6 to identify headings", sufficient for 1.3.1. Test procedure: "Verify that heading markup is applied when content functions as a heading, with the markup accurately reflecting the appropriate heading level." — confirms (wrong level fails the technique's own check #1; an empty `<h1></h1>` fails check #2, "heading markup is not applied to non-heading content").
- https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html — lists failure F43 "Failure of Success Criterion 1.3.1 due to using structural markup in a way that does not represent relationships in the content". — confirms (this is the failure that applies, not "multiple h1").
- https://www.w3.org/TR/WCAG22/#headings-and-labels — SC 2.4.6 Headings and Labels (Level AA): "Headings and labels describe topic or purpose." Understanding (https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html): "This success criterion requires that if headings or labels are provided, they be descriptive. This success criterion does not require headings or labels." — adds nuance (an empty `<h1>` is a heading that describes nothing, so 2.4.6 applies to the empty case; multiple h1s do not fail 2.4.6).
- https://www.w3.org/TR/WCAG22/#section-headings — SC 2.4.10 Section Headings (Level AAA): "Section headings are used to organize the content." — adds nuance (AAA only).
- https://html.spec.whatwg.org/multipage/sections.html — §4.3.11 Headings and outlines: "The outline is all headings in a document, in tree order." "If a document has one or more headings, at least a single heading within the outline should have a heading level of 1. Each heading following another heading lead in the outline must have a heading level that is less than, equal to, or 1 greater than lead's heading level." And: "A document can contain multiple top-level headings" (followed by a conforming three-`<h1>` example). — adds nuance: multiple `<h1>`s are conforming HTML; the old outline algorithm is gone, so a second `<h1>` is just a second top-level heading, and an `h1 → h3` skip is non-conforming. The spec has no statement that a page must have exactly one h1.
- Not fetched, verify before citing: the ACT rule "Heading has non-empty accessible name" is the standard automated check for `<h1></h1>`.

Verdict: confirmed. Multiple `<h1>`s are not a WCAG failure per se (HTML permits them); the defensible citations are 1.3.1 / F43 (heading level misrepresents structure when a hero is not first, or sits under `BlogHeader`'s `<h1>` in `apps/web/src/app/blog/page.tsx:157-165`) and 2.4.6 for the empty heading. "High" is justified more by SEO and the empty-heading case than by WCAG; the fix in the audit (`isFirst ? "h1" : "h2"` plus a `title` guard, same guard for `cta/index.tsx:61-67`) is exactly what H42's test asks for.

### AUD-029 Autoplaying hero background video and logo marquee have no pause control

Code check: `hero/hero-video.tsx:156-181,206-220,233-246` render `autoPlay loop muted aria-hidden tabIndex={-1}` with no pause affordance; `hero-video.tsx:293` returns `null` under `prefers-reduced-motion`. `logo-cloud/index.tsx:63-74`: the track is `animate-marquee ... focus-within:[animation-play-state:paused] motion-reduce:animate-none` inside `overflow-hidden`; hover only slows it; there is no button. Filler cycles are `inert aria-hidden`, so only the first cycle's links are tabbable. Confirmed.

Sources:
- https://www.w3.org/TR/WCAG22/#pause-stop-hide — SC 2.2.2 Pause, Stop, Hide (Level A), first bullet: "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential". Note 2: "Since any content that does not meet this success criterion can interfere with a user's ability to use the whole page, all content on the web page (whether it is used to meet other success criteria or not) must meet this success criterion. See Conformance Requirement 5: Non-Interference." Note 4: "An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users and if not indicating progress could confuse users or cause them to think that content was frozen or broken." — confirms.
- Same page, glossary: essential — "if removed, would fundamentally change the information or functionality of the content, and information and functionality cannot be achieved in another way that would conform"; pause — "stopped by user request and not resumed until requested by user"; mechanism — "process or technique for achieving a result". — confirms. Does a decorative background video qualify for the exception? No: the exception has two conjuncts, "part of an activity" and "essential". A looping backdrop is not an activity the user is engaged in, and the code itself proves it is not essential: under reduced motion `hero-video.tsx:293` removes it and the page keeps every piece of information and function (the poster stands in). The only "essential" carve-out WCAG names is the preload/progress case in Note 4.
- https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html — "Content that moves or auto-updates can be a barrier to anyone who has trouble reading stationary text quickly as well as anyone who has trouble tracking moving objects." "Five seconds was chosen because it is long enough to get a user's attention, but not so long that a user cannot wait out the distraction if necessary to use the page." Sufficient techniques listed: G4, SCR33, G11, G152, SCR22, G186, G191. Failures: F16, F112, F50, F7. The page contains no sentence about `prefers-reduced-motion`, operating-system settings, or decorative backgrounds. — confirms; adds nuance (OS preference is not mentioned as a mechanism).
- https://www.w3.org/WAI/WCAG22/Techniques/general/G4 — "Allowing the content to be paused and restarted from where it was paused", sufficient for 2.2.2. Test: "Use the mechanism provided in the web page or by the user agent to pause the moving or scrolling content." "Check that the moving or scrolling has stopped and does not restart by itself." — adds nuance: a user-agent mechanism counts, but no shipping browser offers a pause for a `pointer-events-none`, `aria-hidden`, controls-less `<video>` or for a CSS marquee. Hover-slow and focus-pause on the marquee fail check 2 (it restarts when hover/focus leaves). Verify the WCAG glossary note on "mechanism" before arguing that an OS-level reduced-motion switch is a "mechanism"; the prevailing auditor reading, and the Vercel rule below, treat it as not sufficient because it is a global preference, not a per-page pause.
- https://www.w3.org/WAI/WCAG22/Techniques/failures/F16 — "Failure of Success Criterion 2.2.2 due to including scrolling content where movement is not essential to the activity without also including a mechanism to pause and restart the content". — confirms (the marquee matches F16 exactly).
- Vercel Web Interface Guidelines, `command.md` line 59: "Autoplay motion >5 seconds alongside other content needs pause, stop, or hide controls"; line 60: "Muted decorative loops must stop under `prefers-reduced-motion`". — confirms (both halves; the second is met for the hero, not for AUD-063's content video).
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — "The prefers-reduced-motion CSS media feature is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion." — adds nuance: it is an OS/device setting, which is the audit's point.
- Reduced-motion marquee freeze: https://www.w3.org/TR/WCAG22/#focus-visible — SC 2.4.7 Focus Visible (Level AA): "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible." and https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — SC 2.4.11 (Level AA): "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content." — adds nuance: a logo link clipped by `overflow-hidden` on a frozen `w-max` track is a focusable element whose indicator cannot be seen; 2.4.7 is the cleaner citation.

Verdict: confirmed as a Level A failure (2.2.2, F16 for the marquee; G4/G186 are the fixes). The decorative video does not meet the "part of an activity where it is essential" exception. Reduced-motion support is good practice but is an OS preference, not the page-level mechanism 2.2.2 asks for. The secondary reduced-motion clipping issue is 2.4.7 (AA); the audit's "switch to a wrapping grid" fix resolves it.

### AUD-030 Pages whose first block is not a hero have no `<h1>`

Code check: `apps/web/src/app/[...slug]/page.tsx:176-178` renders `<main>` with `PageBuilder` only; `internal/block-header.tsx:25` is hard-coded `<h2>`; the page title appears only as the current breadcrumb `<li aria-current="page">` (`breadcrumbs.tsx:105`). Confirmed.

Sources:
- https://html.spec.whatwg.org/multipage/sections.html — "If a document has one or more headings, at least a single heading within the outline should have a heading level of 1." — confirms, with nuance: this is a "should" (recommendation), not a "must" (conformance requirement). The outline algorithm is gone; there is no sectioning-based promotion that could make a lone `<h2>` act as the page heading.
- https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html — SC 2.4.6 (Level AA): "This success criterion requires that if headings or labels are provided, they be descriptive. This success criterion does not require headings or labels." — contradicts the idea that a missing `<h1>` fails 2.4.6.
- https://www.w3.org/TR/WCAG22/#info-and-relationships — SC 1.3.1 (Level A). — adds nuance: 1.3.1 is failed only if something visually presented as the page heading lacks heading markup. The breadcrumb trail is not styled as a heading, so 1.3.1 is not clearly failed either.
- https://www.w3.org/WAI/WCAG22/Understanding/section-headings.html — SC 2.4.10 Section Headings (Level AAA). — adds nuance: AAA, and the sections do have headings; 2.4.10 does not ask for a page-level heading.
- https://www.w3.org/WAI/WCAG22/Techniques/general/G141 — sufficient for 2.4.10: "authors should use headings that are properly nested (e.g., h1 followed by h2, h2 followed by h2 or h3, h3 followed by h3 or h4, etc.)." — adds nuance (a page opening at `<h2>` is not "properly nested").
- https://www.w3.org/WAI/WCAG22/Techniques/html/H69 — "Since headings indicate the start of important sections of content, it is possible for users with assistive technology to jump directly to the appropriate heading and begin reading the content." — confirms the "jump to h1 lands nowhere" scenario.
- Vercel `command.md` line 24: "Headings hierarchical `<h1>`–`<h6>`; include skip link for main content". — confirms.

Verdict: confirmed as an HTML-spec "should" violation and a Vercel rule violation, with real SEO and screen-reader-navigation cost. It is not a WCAG A/AA failure per se. Keep "medium" on SEO grounds; on WCAG grounds alone it would be low. The `BlockHeader level` prop fix is correct and also fixes AUD-008 in one stroke.

### AUD-031 Blog pagination link contrast fails AA in light mode

Code check: `blog-pagination.tsx:91,141` (`text-zinc-400` on Prev/Next and numbered links, 16px `font-light font-mono`), `:127` (ellipsis span, `aria-hidden`, `text-zinc-400`). Hover goes to `text-foreground`. Confirmed.

Ratios (WebAIM API via curl; own computation from the WCAG relative-luminance formula in parentheses):
- zinc-400 `#A1A1AA` on white `#FFFFFF`: WebAIM `{"ratio":"2.56","AA":"fail","AALarge":"fail"}` (2.56).
- zinc-400 `#A1A1AA` on zinc-100 `#F4F4F5`: WebAIM `{"ratio":"2.33","AA":"fail","AALarge":"fail"}` (2.33).
- `--muted-foreground` light = `oklch(0.442 0.017 285.786)` (globals.css:26) → sRGB `#52525C`; on white: WebAIM `{"ratio":"7.71","AA":"pass","AAA":"pass"}`; on zinc-100: `"7.02"` pass.
- Dark mode: zinc-400 on `#000` = 8.19; `--muted-foreground` dark `#9F9FA9` on black = 8.01. Both pass. The audit's "dark mode is fine" is correct.

Sources:
- https://www.w3.org/TR/WCAG22/#contrast-minimum — SC 1.4.3 Contrast (Minimum) (Level AA): "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1," with exceptions for large text (3:1), incidental text, and logotypes. — confirms.
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html — "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus." Large text: "with at least 18 point or 14 point bold"; "14pt and 18pt are equivalent to approximately 18.5px and 24px." — confirms (16px light weight is not large text; the hover state at `text-foreground` passes; the ellipsis `…` is `aria-hidden` but 1.4.3 is a visual criterion and should change with the links).
- Vercel `command.md` line 139: "Interactive states increase contrast: hover/active/focus more prominent than rest". — adds nuance (the hover jump to foreground is correct; the rest state is the problem).

Verdict: confirmed. Level AA failure of 1.4.3 in light mode, both on white and on the zinc-100 hover surface; `text-muted-foreground` (7.71:1 / 7.02:1) is a correct fix.

### AUD-032 No skip link

Code check: no `href="#main"`, "Skip" text or `skip-link` anywhere in `apps/web/src` or `packages/`. Landmarks present: `<header>` (navbar.tsx:217), `<nav aria-label="Main">` (navbar.tsx:234, mobile-menu.tsx:147), `<main>` on page.tsx:63, `[...slug]/page.tsx:176`, `blog/[slug]/page.tsx:159`, `blog-page-content.tsx:37`, `not-found.tsx:6`; `<footer>` footer.tsx:227. The empty states at `page.tsx:55` and `[...slug]/page.tsx:152-159` have no `<main>`.

Sources:
- https://www.w3.org/TR/WCAG22/#bypass-blocks — SC 2.4.1 Bypass Blocks (Level A): "A mechanism is available to bypass blocks of content that are repeated on multiple web pages." — confirms.
- https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html — "It is not the intent of this success criterion to require authors to provide methods that are redundant to functionality provided by the user agent." Sufficient techniques are listed in two groups: "Creating links to skip blocks" (G1, G123, G124) and "Grouping blocks of repeated material" (ARIA11, H69, PDF9, H64, SCR28). — adds nuance: this is the landmark debate. ARIA11 is a listed sufficient technique, so a page with proper landmarks can claim 2.4.1 conformance without a skip link.
- https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11 — "Landmarks are interpretable by WAI-ARIA-aware assistive technologies and are not exposed by browsers directly to users." "Landmarks also can help sighted keyboard-only users navigate to sections of a page using a browser plugin." — adds nuance, and is the strongest argument for the skip link: sighted keyboard users (switch users, RSI, low vision without a screen reader) get nothing from landmarks in any shipping browser without an extension.
- https://www.w3.org/WAI/WCAG22/Techniques/general/G1 — "Adding a link at the top of each page that goes directly to the main content area". "The first interactive item in the web page is a link to the beginning of the main content." "links that are visible only when they have focus" are acceptable. Test procedure checks 4 and 5: activation "directs focus to the main content area" and "keyboard focus has successfully transferred to main content". — adds nuance for the fix: `id="main"` on `<main>` alone does not reliably move focus (only scroll) in every browser; add `tabIndex={-1}` to the `<main>` so G1 checks 4 and 5 pass. Also: on hero pages `<main className="-mt-16">` sits under the sticky 64px navbar, so the skip target needs `scroll-margin-top`.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a — "A skip link is a link placed as early as possible in `<body>` content that points to the beginning of the page's main content. Usually, CSS hides a skip link offscreen until focused." — confirms the audit's fix shape.
- https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/ — "Each page should have one `main` landmark." "The `main` landmark should be a top-level landmark." — confirms; and shows the empty states (no `<main>`) break even the landmark route.
- Vercel `command.md` line 24: "Headings hierarchical `<h1>`–`<h6>`; include skip link for main content". — confirms.

Verdict: confirmed as a real gap, with one nuance the ticket should carry: because the site already uses landmarks (ARIA11) it is arguably conforming to 2.4.1 for screen-reader users, so "WCAG 2.4.1 failure" overstates it; the skip link is what serves sighted keyboard users, whom landmarks do not reach. Keep medium. Fix additions: `tabIndex={-1}` on `<main>`, `scroll-margin-top` for the sticky navbar, and a `<main>` on the two empty states.

### AUD-034 Pinned footer is focusable while hidden behind page content

Code check: `sticky-footer.tsx:118` — `footer-pinned fixed inset-x-0 bottom-0 z-0` with a `before:` pseudo painting a full-screen `bg-background` above it; `layout.tsx:72` wraps content in `relative z-10 min-h-dvh bg-background`; footer links at `footer.tsx:98-108,267-283` are ordinary tabbable `<Link>`s. Confirmed by reading; the audit's "needs a manual tab-through" caveat stands.

Sources:
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — SC 2.4.11 Focus Not Obscured (Minimum) (Level AA): "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content." Intent: "Typical types of content that can overlap focused items are sticky footers, sticky headers, and non-modal dialogs. As a user tabs through the page, these layers of content can obscure the item receiving focus, along with its focus indicator." — confirms (here the roles are inverted: the page content is the layer entirely hiding the focused footer link, which is squarely "author-created content").
- Same page, the reveal nuance: "If the user can bring the item with focus into view using a method without having to navigate back to the user-opened content to dismiss it, this criterion would be passed." — adds nuance / partly contradicts: a user who presses End does reveal the footer without moving focus, so a strict reading may pass. But the Understanding text frames that as applying to content the user opened; the page shell was not opened by the user, and the browser's own focus scroll-into-view is defeated because the target is `position: fixed`. Treat as a probable 2.4.11 failure that needs the manual check the audit already asks for.
- https://www.w3.org/TR/WCAG22/#focus-visible — SC 2.4.7 Focus Visible (Level AA). — confirms (indicator is painted but under an opaque layer, so not visible).
- https://www.w3.org/TR/WCAG22/#focus-order — SC 2.4.3 Focus Order (Level A). — adds nuance: order is logical (footer last), so 2.4.3 is not the right citation; operability is the issue, covered by 2.4.11/2.4.7.
- Vercel `command.md` Focus section: "overlays mustn't cover focused elements". — confirms.

Verdict: confirmed as a probable 2.4.11 (AA) and 2.4.7 (AA) failure, subject to the manual tab-through the audit already requests. The `focusin` → scroll-to-bottom fix is the "scroll padding" remedy the Understanding document itself suggests for sticky layers.

### AUD-035 Blog image alt text overrides the CMS alt and duplicates adjacent text

Code check: `blog-card.tsx:23` `alt={title ?? "Blog post"}`; `:78` avatar `alt={author.name}` beside the visible name; `groq-fragments.ts:3-10` `"alt": coalesce(alt, asset->altText, caption, asset->originalFilename, "untitled")`. Confirmed.

Sources:
- https://www.w3.org/TR/WCAG22/#non-text-content — SC 1.1.1 Non-text Content (Level A): "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose". Decoration exception: "If non-text content is pure decoration, is used only for visual formatting, or is not presented to users, then it is implemented in a way that it can be ignored by assistive technology." — confirms.
- https://www.w3.org/WAI/WCAG22/Techniques/failures/F30 — "Failure of Success Criterion 1.1.1 and 1.2.1 due to using text alternatives that are not alternatives". "If the text in the 'text alternative' cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative." Examples of inadequate alternatives include placeholder words like "spacer" or "image" and filenames such as "Oct.jpg" or "Chart.jpg". — confirms: the `asset->originalFilename` fallback is a textbook F30, and so is the `"Blog post"` / `"untitled"` placeholder. This part is a hard Level A failure.
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html — lists H67 "Using null alt text and no title attribute on img elements for images that assistive technology should ignore" and F39. — confirms the `alt=""` fix for avatars next to the visible name.
- Redundant alt (image alt equal to the adjacent heading): no fetched W3C page names duplicated alt as a failure; it is a verbosity problem, not a 1.1.1 failure. — adds nuance.

Verdict: confirmed. Split the severity in the ticket: the filename/placeholder coalesce is a Level A failure (1.1.1 via F30); the duplicated title and avatar names are best-practice fixes (H67). Also drop `caption` from the coalesce chain, since a caption is not an alternative either.

### AUD-036 "Link Broken" is rendered to real visitors

Code check: `internal/sanity-buttons.tsx:57-60` returns `<Button>Link Broken</Button>` (a real `<button>` with no handler); `internal/rich-text.tsx:94-101` returns an underlined "Link Broken" `<span>`. Neither is gated on draft mode. Confirmed.

Sources:
- https://www.w3.org/TR/WCAG22/#link-purpose-in-context — SC 2.4.4 (Level A). — adds nuance: neither fallback is a link, so 2.4.4 does not apply.
- https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html — SC 4.1.2 (Level A). — adds nuance: the `<button>` has a name and role; it merely does nothing. Not a 4.1.2 failure.
- Vercel `command.md` line 19: "`<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)". — adds nuance: a `<button>` with no action inverts this rule.
- No W3C source found that maps a visible editor-facing placeholder shipped to production to a specific success criterion.

Verdict: no clean WCAG citation; this is a content-quality and UX defect (an inert `<button>` in the tab order that announces "Link Broken, button"), not a conformance failure. The audit's severity and fix are sensible on product grounds; the ticket should not cite WCAG.

### AUD-061 Duplicate hard-coded section ids across blocks

Code check: `cta` (cta:55), `faq` (faq-accordion:616), `features` (feature-cards-icon:63), `hero-split` (:27), `hero` (hero:181 and :196, mutually exclusive branches), `logo-cloud` (:66), `showcase` (showcase-grid:390,400), `socials` (social-grid:139), `subscribe` (:125), `video-feature` (:33). None is referenced by `aria-labelledby`, `aria-controls`, `for`, or `headers`. Confirmed.

Sources:
- https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute — "When specified on HTML elements, the id attribute value must be unique amongst all the IDs in the element's tree and must contain at least one character." — confirms (a "must": two CTAs on one page are non-conforming HTML).
- https://www.w3.org/WAI/WCAG22/Techniques/failures/F77 — "Failure of Success Criterion 4.1.1 due to duplicate values of type ID". "This failure relates to 4.1.1 Parsing, which was removed as of WCAG 2.2." — adds nuance.
- https://www.w3.org/WAI/WCAG22/Understanding/parsing.html — "This criterion no longer has utility and is removed." "Many issues that would have failed this criterion will fail Info and Relationships or Name, Role, Value." — contradicts a WCAG 2.2 framing: since none of these ids anchors an ARIA/label relationship, there is no 1.3.1 or 4.1.2 consequence and therefore no WCAG 2.2 failure.
- https://www.w3.org/TR/WCAG22/ — "Authors that are required by policy to conform with WCAG 2.0 or 2.1 will be able to update content to WCAG 2.2, but may need to continue to test and report 4.1.1." — adds nuance (still reportable under a 2.0/2.1 policy).

Verdict: confirmed as invalid HTML (spec "must") with a functional consequence (`#cta` fragment resolves to the first only); not a WCAG 2.2 failure. Low is right.

### AUD-062 `target="_blank"` links without a new-tab announcement

Code check: `rel="noopener noreferrer"` present at every cited site. "(opens in a new tab)" appears only in `github-stars.tsx:29` (in `aria-label`), `rich-text.tsx:115` and `sanity-buttons.tsx:76` (sr-only span). Missing at the other cited sites. Confirmed.

Sources:
- https://www.w3.org/WAI/WCAG22/Techniques/general/G201 — "Technique G201: Giving users advanced warning when opening a new window". Listed as Advisory for 2.4.4, 2.4.6, 2.4.9, and 3.2.5. "Opening a new tab or window when a link or button is activated can be disorienting for people who have difficulty perceiving visual content." Example 2 uses `aria-describedby` and hidden text "opens in a new window". — confirms the fix pattern; adds nuance: advisory, not sufficient, and not a failure technique.
- https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html — SC 3.2.5 Change on Request (Level AAA): "clicking on a link which opens a new window or tab is an example of two separate changes of context". — adds nuance: at AAA an unannounced new tab is a change of context the user did not explicitly request; at A/AA there is no failure.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a — "Links that open in a new tab/window via `target="_blank"`, or links that point to a download file should indicate what will happen when the link is followed." "Older screen-reading software may not even announce the behavior." Also: "Setting `target="_blank"` on `<a>` elements implicitly provides the same `rel` behavior as setting `rel="noopener"`". — confirms; adds nuance that the explicit `rel` is belt-and-braces.
- https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html — SC 2.4.4 (Level A); F89. — confirms the showcase `alt=""` half of the fix (the card's name is currently "Visit X" + image alt + body copy).

Verdict: confirmed as advisory best practice (G201, MDN), an AAA concern (3.2.5), and not an A/AA failure; the showcase-card accessible-name bloat is a real 2.4.4 quality issue. Low is correct. Note for the fix: where the accessible name comes from `aria-label` (footer socials, share links) the suffix must go into the `aria-label`; an sr-only span inside an `aria-label`led element is ignored.

### AUD-063 Content video autoplay ignores `prefers-reduced-motion`

Code check: `internal/mux-video.tsx:54-58` `const autoPlay = Boolean(options?.autoPlay)`; `:85-101` `<MuxPlayer autoPlay=... loop=... muted=...>` — no reduced-motion check; `usePrefersReducedMotion` exists only in `hero/hero-video.tsx:120` (module-private). MuxPlayer ships its own transport controls, so a pause exists. Confirmed.

Sources:
- https://www.w3.org/TR/WCAG22/#pause-stop-hide — SC 2.2.2 requires "a mechanism for the user to pause, stop, or hide it"; G4 test: "Use the mechanism provided in the web page or by the user agent to pause". — contradicts a 2.2.2 framing: the player's own pause button is that mechanism, so an autoplaying content video with visible controls passes 2.2.2 even with loop on.
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html — SC 2.3.3 Animation from Interactions (Level AAA) addresses animation triggered by user interaction, not autoplaying video. — adds nuance: there is no A/AA/AAA criterion that mandates honouring `prefers-reduced-motion` for video.
- https://www.w3.org/WAI/WCAG22/Techniques/css/C39 — "Using the CSS prefers-reduced-motion query to prevent motion", sufficient for 2.3.3 only. — adds nuance.
- Vercel `command.md` line 60: "Muted decorative loops must stop under `prefers-reduced-motion`"; line 53: "Honor `prefers-reduced-motion` (provide reduced variant or disable)"; line 93: "Short non-essential loops: … `prefers-reduced-motion` media condition, and still fallback". — confirms (this is the normative source for the finding).

Verdict: confirmed as a Vercel-guideline and best-practice gap, not a WCAG failure. Low is right. Export `usePrefersReducedMotion` from `internal/` rather than duplicating it.

### AUD-070 Small accessibility and UX polish

Per bullet, in the audit's order.

- Footer column headings at `/60` (`footer.tsx:258`): `--accent-green` = `oklch(0.935 0.226 122)` → `#D1FF07`; `--accent-green-foreground` = `#18181B` in both themes. Composited at 60% → `#627413`, 4.47:1; at 70% → `#505D15`, 6.18:1. 14px uppercase is not large text. Source: SC 1.4.3 (AA) "at least 4.5:1". — confirms (a genuine, if marginal, AA failure; `/70` fixes it). The ratio is identical in dark mode because both tokens are theme-invariant here.
- `transition-all` at `social-grid/index.tsx:105`: Vercel `command.md` line 55 "Never `transition: all`—list properties explicitly". — confirms; no WCAG criterion.
- Ellipsis typography: Vercel line 64 "`…` not `...`"; line 67 "Loading states end with `…`". — confirms; no WCAG criterion.
- Newsletter email input: Vercel line 39 "Inputs need `autocomplete` and meaningful `name`", line 40 "Use correct `type` ... and `inputmode`", line 43 "Disable spellcheck on emails, codes, usernames (`spellCheck={false}`)". Blog search: lines 39, 40, 48 "`autocomplete="off"` on non-auth fields to avoid password manager triggers". — confirms; add "missing `name`" to the blog-search bullet. WCAG angle: `autocomplete` on an email field is SC 1.3.5 Identify Input Purpose (AA); verify wording before citing.
- No `<meta name="theme-color">`: Vercel line 120 "`<meta name="theme-color">` matches page background". — confirms; no WCAG criterion.
- `video-feature/index.tsx:41-53` `<figure>` with only a `<figcaption>`: SC 1.3.1 and F43. — confirms, weakly (low).
- `footer.tsx:269` `href={link.href ?? "#"}`: no WCAG criterion names a dead `#` link. — product defect, not conformance. Note `footer.tsx:104` has the same `?? "#"` but the list is pre-filtered on `link.url` at `:92`, so that one is dead code, not a dead link.
- Search/filter state only in `useState`: Vercel "Navigation & State" section; no WCAG criterion.
- Sticky 64px header and `scroll-margin`: Vercel line 25 "`scroll-margin-top` on heading anchors". WCAG: 2.4.11 (AA) as quoted under AUD-034 ("sticky headers … can obscure the item receiving focus"), and the Understanding document's suggested remedy is "using scroll padding so the banner does not overlap other content". — confirms, and 2.4.11 makes this more than polish for any focus target that lands under the header (the skip-link target in AUD-032 included).
- `hero-blur` not disabled under reduced motion: Vercel line 53 "Honor `prefers-reduced-motion`". WCAG 2.3.3 (AAA) Understanding: "Changes in color, blurring, or opacity without perceived size/shape/position changes don't constitute motion animation." — contradicts a WCAG framing: a scroll-driven blur is explicitly not motion animation under 2.3.3, so this is a Vercel-rule item only. Keep it, drop any WCAG reference.
- Theme toggle group: `role="group" aria-label="Theme"` is a recommended pattern, not a failure. No source found for the group requirement specifically.
- Empty states without `<main>`: APG "Each page should have one `main` landmark." and 2.4.1 via ARIA11 (landmarks are the site's only bypass mechanism today). — confirms.

Verdict: the footer heading contrast is a real 1.4.3 (AA) failure by 0.03 and should be pulled out as its own low ticket; the `hero-blur` bullet should not cite WCAG; the `scroll-margin` bullet is stronger than "polish" because 2.4.11 applies; the rest are Vercel/best-practice items correctly grouped as low.

### New findings from accessibility research

#### AUD-071 Blog search result count is not announced to assistive technology

- Severity: low. Area: web, accessibility. Confidence: high.
- Files: `apps/web/src/components/blog-search-results.tsx:23-42` (`SearchResultsHeader`, "N articles found" / "No articles found"), `apps/web/src/components/blog-search-layout.tsx:21-37` (`isSearching`, error and empty branches). No `aria-live` in either file; the only live regions in the app are the newsletter status and the FAQ ask row.
- Problem: typing in the search box replaces the list and the count client-side, but nothing is in a live region, so a screen-reader user hears no confirmation that results changed, how many there are, or that the search failed.
- Scenario: a screen-reader user types "cache"; the results list re-renders below; they hear nothing and keep typing or assume nothing matched.
- Fix: give the count/status `<p>` (and the "Searching…" / error states) `role="status" aria-live="polite"`, or add a single sr-only status node as `subscribe-newsletter` does.
- Source: Vercel `command.md` line 22 "Async updates (toasts, validation) need `aria-live="polite"`". WCAG: SC 4.1.3 Status Messages (Level AA) is the matching criterion; verify the wording before citing.

#### AUD-072 No `preconnect` for the Mux hosts that the autoplaying hero loads from

- Severity: low. Area: web, performance. Confidence: medium.
- Files: `apps/web/src/app/layout.tsx:41` (`preconnect("https://cdn.sanity.io")` only), `packages/sanity-blocks/src/internal/mux.ts`, `packages/sanity-blocks/src/hero/hero-video.tsx:156-181`.
- Problem: pages whose hero uses the `mux` or `mux-mp4` path fetch the manifest/MP4 and poster from Mux hosts on first paint with no connection warm-up, while Sanity's CDN is preconnected.
- Fix: `preconnect` the Mux hosts used by `internal/mux.ts` from the hero component (React 19 `preconnect()` can be called from the block that needs it) so pages without Mux do not pay for it.
- Source: Vercel `command.md` line 90 "Add `<link rel="preconnect">` for CDN/asset domains".

#### AUD-073 `touch-action: manipulation` is not set on interactive controls

- Severity: low. Area: ui, UX. Confidence: high.
- Files: `packages/ui/src/styles/globals.css`, `packages/ui/src/components/button.tsx` (no `touch-action` / `touch-manipulation` anywhere in `packages/ui`, `packages/sanity-blocks`, `apps/web`).
- Problem: buttons, links and the FAQ `<summary>` rows keep the browser's double-tap-to-zoom heuristic, which adds the tap delay on some mobile browsers and makes quick double taps on the accordion zoom instead of toggle.
- Fix: `touch-manipulation` on the shared `Button`, the nav/footer link classes and the FAQ summary, or `a, button, summary, [role="button"] { touch-action: manipulation }` in `globals.css`.
- Source: Vercel `command.md` line 104 "`touch-action: manipulation` (prevents double-tap zoom delay)".

Items checked and found not to be new findings: `<html lang="en">` present; `color-scheme` set by `next-themes`; blog-card `outline-none` is covered by `.focus-ring-within:has(a:focus-visible)`; blog-search clear button has `aria-label`; marquee filler cycles are `inert aria-hidden`.

---

## Sanity findings: official documentation backing

Scope: AUD-003, 004, 005, 013, 014, 018, 019, 022, 044, 048, 052, 053, 054, 056, 057, 058, 059, 060. Sanity docs were pulled as their `.md` variants (`https://www.sanity.io/docs/<path>.md`) so quotes are verbatim; third-party READMEs and specs were fetched raw. Installed versions checked: `sanity` 6.11.0, `@sanity/blueprints` 0.24.0, `@sanity/runtime-cli` 17.8.0, `sanity-plugin-mux-input` 5.0.12, `next-sanity` 13.3.3, `slugify` 1.6.9.

In-repo skill rules the findings map to (`.claude/skills/sanity-best-practices/`): AUD-003 → `references/functions.md` "Environment Variables"; AUD-004 → `schema.md` §6 (deprecate → migrate with `coalesce()` → remove); AUD-005 → `visual-editing.md` §4 "Document Locations"; AUD-014 → `studio-structure.md` §4 "Singleton Pattern (Critical)"; AUD-019 → `groq.md` §2 "Query Fragments"; AUD-052 → `functions.md` "GROQ Filter Tips" and `seo.md` §6; AUD-057 → `groq.md` §7 "API Version Best Practices"; AUD-056 → `visual-editing.md` §3.

### AUD-003 Deployed invalidate-tags Function has no env vars

Sources:
- https://www.sanity.io/docs/functions/function-env-vars — "Variables added with `functions env add` aren't available locally, but you can simulate them by prefixing your CLI command with the variable and value." … "Before you can add environment variables, you need to deploy the blueprint." … "All environment variables are accessible on `process.env`." — confirms (deployed env comes only from the CLI or blueprint; the local shell env is only for `functions test`).
- https://www.sanity.io/docs/blueprints/blueprint-config — "**env** (object) Set environment variables for the function. The env object accepts custom keys with string values. This is an alternative approach to using the sanity functions env CLI command. Note: Setting environment variables in this manner is only additive." — confirms the blueprint `env` path the audit proposes.
- https://www.sanity.io/docs/cli-reference/functions — "USAGE $ sanity functions env add NAME KEY VALUE [--json] [--stack <value>]" — confirms.
- https://www.sanity.io/docs/functions/sync-tag-function-quickstart — "Keep in mind that any environment variables added before destroying the blueprint will not carry over." — adds nuance (CLI-added vars are stack state; blueprint `env` is the reproducible option, which favours the audit's first fix).
- https://www.sanity.io/docs/blueprints/deploy-blueprints-from-ci — "Your CI job exposes it to the CLI as the SANITY_AUTH_TOKEN environment variable" … "**SANITY_BLUEPRINT_STACK_ID** (required) The Stack to deploy". Also https://www.sanity.io/docs/blueprints/blueprint-action (official GitHub Action). — confirms the "nothing deploys the blueprint" half and gives the README content.
- Installed code: `@sanity/runtime-cli` 17.8.0 `dist/utils/functions/invoke/local.js:196` spawns the local child with `env: { ...process.env, ...resource.env, ... }`; no `dotenv` or `.env` reading exists anywhere in the deploy path. `@sanity/blueprints` 0.24.0 `dist/types/functions/index.d.ts:29` declares `env?: Record<string, string>` on the shared function options, so `defineSyncTagInvalidateFunction` accepts `env` too.

Verdict: confirmed, definitively. A deployed Function receives env vars only from `env` in the blueprint or `sanity functions env add`; `apps/studio/.env` is merged into `process.env` only for local `functions test` and `dev`. The blueprint's `import "dotenv/config"` already loads `.env` at deploy time, so `env: { NEXT_PUBLIC_SITE_URL, SANITY_REVALIDATE_SECRET }` read from `process.env` is the one-line fix. CLAUDE.md's line "read only by the deployed Sanity Function" is misleading as written.

### AUD-004 Hero schema and renderer disagree on blank `mediaType`

Sources:
- https://www.sanity.io/docs/studio/validation — "By default, values that do not pass the validation rules are considered errors - these will block the draft from being published until they have been resolved." … "Without the `required()` call, the title is also considered valid if it does not have a value." — confirms that `Rule.required()` on a field absent from pre-existing documents blocks publish.
- https://www.sanity.io/docs/studio/conditional-fields — "**parent** (object | undefined) The values of the field's parent. … Remember that it can return undefined." — confirms the `hidden: showFor(...)` mechanism (it decides purely from `parent.mediaType`).
- In-repo skill `references/schema.md` §6 "Safe Schema Updates": "Phase 2: Migrate — Update frontend to use new fields (with `coalesce()` fallbacks). Create a migration". — confirms the audit's "run the `hero-media-type` migration on every dataset" alternative; `apps/studio/migrations/hero-media-type` exists.
- No official doc sentence was found stating verbatim that `initialValue` does not backfill existing documents; the claim rests on the schema and validation semantics above.

Verdict: confirms. Docs support both halves (required blocks publish; hidden is driven by `parent`). The `selected()` versus `mediaTypeOf()` divergence is a code fact.

### AUD-005 Presentation "Used on" locations keyed on a nonexistent type

Sources:
- https://www.sanity.io/docs/visual-editing/presentation-resolver-api — "The `resolve.locations` property of the Presentation Tool's configuration accepts an object whose keys each correspond to a document type in your schema. The corresponding value provides a method for resolving document location state." — confirms: keys are schema type names, so `home` never matches `homePage`.
- In-repo skill `references/visual-editing.md` §4: example keyed `post: defineLocations({...})`. — confirms the fix shape.

Verdict: confirms. Nuance: `apps/studio/documents.ts:46-55` (`mainDocuments`) already resolves `/` and `/blog` to `homePage` and `blogIndex` correctly, so navigating Presentation by URL works; only the locations banner ("Used on") is broken for those two types.

### AUD-013 Newsletter form posts to nowhere

Sources:
- https://html.spec.whatwg.org/multipage/form-control-infrastructure.html — "The action of an element is the value of the element's formaction attribute, if the element is a submit button and has such an attribute, or the value of its form owner's action attribute, if it has one, or else the empty string." … "If action is the empty string, let action be the URL of the form document." — confirms the full-page POST to the current route.
- https://nextjs.org/docs/app/guides/forms — "React extends the HTML `<form>` element to allow Server Actions to be invoked with the `action` attribute." … "To display validation errors or messages, turn the component that defines the `<form>` into a Client Component and use React `useActionState`." (example renders `<p aria-live="polite">{state?.message}</p>`). — confirms the proposed fix.

Verdict: confirms. The audit's fix mirrors Next's documented `useActionState` pattern.

### AUD-014 Singletons can be duplicated or deleted; unpinned queries

Sources:
- https://www.sanity.io/guides/singleton-document — "Removing document actions like 'duplicate' and 'delete' that can cause issues with singleton document types." with `actions: (input, context) => singletonTypes.has(context.schemaType) ? input.filter(({ action }) => action && singletonActions.has(action)) : input` and a matching `templates` filter. — confirms the `document.actions` fix.
- https://www.sanity.io/docs/studio/new-document-options — "Singleton documents (like site settings) should not appear in the global create menu since only one instance should exist. Filter them out by template ID" … "Starting in Studio version `6.17.0`, there's a dedicated API for creating singletons." — confirms the current filter is only the create-menu half.
- https://www.sanity.io/docs/studio/create-a-link-to-a-single-edit-page-in-your-main-document-type-list — `document: { singletons: ['siteSettings'] }` … "It generates a dedicated initial value template for each singleton and keeps it out of every part of Studio that can create documents, including the global create menu, structure panes, and reference inputs. It removes the `duplicate` document action." — adds nuance: the first-class API needs Studio 6.17.0 or newer (installed is 6.11.0, and AUD-039 proposes 6.16.0, so bump the target to 6.17.0 or newer) and removes Duplicate but not Delete or Unpublish, so an `actions` filter is still required either way.
- In-repo skill `references/studio-structure.md` §4: "Querying Singletons // By fixed ID (most efficient) `*[_id == "settings"][0]` // By type (works but slower) `*[_type == "settings"][0]`" — confirms pinning the queries on `_id`.

Verdict: confirms. No `document.actions` exists anywhere in `apps/studio`. Prefer `document.singletons` once Studio is 6.17.0 or newer, plus an actions filter for delete and unpublish.

### AUD-018 `NEXT_PUBLIC_SITE_URL` missing from `.env.example`; scheme double-prefix

Sources:
- https://vercel.com/docs/environment-variables/system-environment-variables — "`VERCEL_URL` … The value does not include the protocol scheme https://." and "`VERCEL_PROJECT_PRODUCTION_URL` … This is useful to reliably generate links that point to production such as OG-image URLs. The value does not include the protocol scheme https://." — adds nuance: for Vercel-injected values the unconditional `https://` prefix is correct; the double-prefix only bites hand-set values, which is exactly the self-hosted case.
- https://env.t3.gg/docs/core — on `emptyStringAsUndefined`: "In order to solve these issues, we recommend that all new projects explicitly specify this option as true." — confirms the repo's config; a blank `NEXT_PUBLIC_SITE_URL=` line in `.env.example` is safe to add.

Verdict: confirms.

### AUD-019 GROQ fragments duplicated between packages

Sources:
- In-repo skill `references/groq.md` §2 "Query Fragments — Use string interpolation to reuse query logic and keep queries maintainable." — confirms the one-source-of-truth pattern.
- https://www.sanity.io/docs/apis-and-sdks/sanity-typegen — "By using `defineQuery` when writing your GROQ queries the Sanity Client will automatically return types when the query is used with `fetch`, after running `sanity typegen generate`." — adds nuance: TypeGen works on the final interpolated string, so drift between copies produces silently different generated types, which is the failure the audit describes.
- No official Sanity doc forbids duplicated fragments; this is a maintainability rule from the skill, not a platform requirement.

Verdict: confirms (skill-backed).

### AUD-022 Mux `policy` read from `playback_ids[0]`

Sources:
- https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-mux-input (README) — "The token is stored in the dataset as a document of the type `mux.apiKey` with the id `secrets.mux`." … "### Signed URLs (private playbacks) To enable signed URLs with content uploaded to Mux, you will need to check the 'Enable Signed Urls' option in the Mux Plugin configuration." — confirms signed assets are a supported plugin path.
- Installed plugin 5.0.12 `dist/index.js:1156` — `function getPlaybackId(asset, priority = ["drm","signed","public"]) { … for (let policy of priority) { let match = playbackIds.find((entry) => entry.policy === policy); if (match) return match.id; } return playbackIds[0].id; }` and `getPlaybackPolicy(asset)` looks up the entry matching that id. — confirms the audit's premise: the plugin prefers signed over public and matches policy by id, not by index.
- https://www.mux.com/docs/guides/play-your-videos — "Each `asset` and each `live_stream` in Mux can have one or more Playback IDs."; https://www.mux.com/docs/guides/secure-video-playback — "Signed playback policies will enable playback URLs that require a valid JSON Web Token (JWT) to gain access." — confirms the failure mode.

Verdict: confirms. Nuance on the fix: the stored `playbackId` lives on the asset document, so the safer GROQ form is `...asset->{ "playbackId": playbackId, "policy": data.playback_ids[id == ^.playbackId][0].policy, ... }` (skill `groq.md` §5: "`^` = parent document (in nested queries)"). Verify in Vision as the audit says.

### AUD-044 Article JSON-LD publisher always the fallback

Sources:
- https://developers.google.com/search/docs/appearance/structured-data/article — "There are no required properties; instead, add the properties that apply to your content." `publisher` does not appear in the recommended-properties table. No logo requirement is stated. — adds nuance: Google neither requires nor lists `publisher` or `logo` for Article.
- https://schema.org/Article — `publisher`: "The publisher of the article in question." Expected types Organization or Person. — confirms the shape emitted is valid.

Verdict: adds nuance. The bug (props accepted but never passed, wrong site name in output) is real, but nothing in Google's or Schema.org's docs makes it an SEO defect; treat as a correctness and dead-prop fix. Low is defensible.

### AUD-048 `/api/presentation-draft` 500s instead of 503 on a placeholder token

Sources:
- https://github.com/sanity-io/visual-editing/blob/main/packages/preview-url-secret/README.md — "Create an API token with viewer rights, and put it in an environment variable named `SANITY_API_READ_TOKEN`" … `// Required, otherwise the URL preview secret can't be validated` — confirms a valid token is a hard requirement of `validatePreviewUrl`; behaviour with a garbage token is undocumented (the 500 is inferred, not documented).
- https://www.sanity.io/docs/nextjs/visual-editing-with-next-js-app-router — `export const {GET} = defineEnableDraftMode({ client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN || '' }) })` — adds nuance: the official pattern passes the token straight through exactly as the repo does; the 503 guard is a repo-consistency improvement, not a doc requirement.

Verdict: confirms mechanism, adds nuance on severity (low is right).

### AUD-052 Auto-redirect output dormant until deploy; filter lacks `_type` guard

Sources:
- https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects — "`redirects` can be defined as a synchronous or async function." … "Redirects are checked before the filesystem which includes pages and `/public` files." In-repo skill `references/seo.md` §6 endorses the same pattern and notes "Vercel allows max 1,024 redirects in `next.config`. For more, use middleware." — adds nuance: build-time redirects are the skill's recommended pattern; the audit's "document it or add a runtime lookup" framing is right.
- https://www.sanity.io/docs/specifications/groq-functions — "`changedAny` filtering will only work when a field previously existed. For this reason, newly created documents won't act as expected." — adds nuance relevant to the deprecated `publish` event (new finding below).
- In-repo skill `references/functions.md` "GROQ Filter Tips — Only the filter body — `_type == 'post'` … Combine conditions" — confirms adding `_type in ["page","blog"]`.

Verdict: confirms the doc gap and the missing `_type` guard.

### AUD-053 SEO/OG "required" warnings never fire

Sources:
- https://www.sanity.io/docs/studio/validation — "You can also set a rule to be a warning, simply by calling `warning()` on the rule." … "Without the `required()` call, the title is also considered valid if it does not have a value." — confirms `warning()` only sets the level of constraints already on the rule.
- Installed `@sanity/schema` 6.11.0 `lib/Schema-ClAx8eCc.js:61` — `warning(message) { let rule = this.clone(); return rule._level = "warning", rule._message = message || void 0, rule; }`; and `sanity/lib/datastores-QCSg1Xje.js:3355-3360` `validate()` only iterates `this._rules`, so a rule with `_level` but no constraints yields no markers. — confirms definitively.

Verdict: confirms. The `max(160).warning(...)` siblings do work.

### AUD-054 Redirect preview always "Permanent"

Sources:
- https://www.sanity.io/docs/studio/previews-list-views — "With the `prepare` function, you can access the values that you have selected and customize them." — confirms `prepare` is the right place; nothing coerces types.
- https://developer.mozilla.org/en-US/docs/Glossary/Truthy — "All values are truthy except `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`, and `document.all`." with example `if ("false"); // This executes the if block because "false" is a truthy value` — confirms.
- Repo: `packages/sanity/src/query.ts:367` `"permanent" : permanent == "true"` (correct); `apps/studio/functions/auto-redirect/index.ts:52` writes `permanent: "true"`, which matches the string-typed schema field, so that part of the audit's "verify" is fine.

Verdict: confirms.

### AUD-056 `SANITY_API_WRITE_TOKEN` required with no runtime reader

Sources:
- https://www.sanity.io/docs/nextjs/visual-editing-with-next-js-app-router — env block lists only `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN=your-viewer-token`. — confirms a write token is not part of the documented integration.
- In-repo skill `references/visual-editing.md` §3 "Token Handling": only `SANITY_API_READ_TOKEN` is required. — confirms.

Verdict: confirms. Nuance: keep it optional rather than deleting it; `apps/web/.env.example` says `SANITY_E2E_SESSION_TOKEN` "falls back to SANITY_API_WRITE_TOKEN" for the Presentation e2e suite.

### AUD-057 `DEFAULT_SANITY_API_VERSION` is `new Date()` at module load

Sources:
- https://www.sanity.io/docs/content-lake/api-versioning — "Write the date as a literal string. Computing it at runtime (for example from `new Date()`) means your API version changes every day, so a change to the API can alter your app's behavior without you deploying anything. A hardcoded date pins the behavior until you decide to move it." … "Clients should be configured with an explicit, static API version." — confirms.
- https://www.sanity.io/docs/help/js-client-api-version — "**Recommended:** `apiVersion: '2026-07-28'` **Not recommended:** `apiVersion: new Date().toISOString().slice(0, 10)`" — confirms; the "not recommended" line is character-for-character the code in `packages/env/src/constants.ts:4`.
- In-repo skill `references/groq.md` §7 — "Always use dated versions (`YYYY-MM-DD`) … Dated versions lock behavior; `v1` or `vX` may change unexpectedly." — confirms.

Verdict: confirms strongly; contradicts the code comment. The comment in `constants.ts` ("Sanity recommends pinning the client to today's UTC date … Computed at runtime") and CLAUDE.md's "uses the current UTC date at runtime" misstate the docs. Scope is wider than the audit lists: `apps/studio/utils/constant.ts:29-30` `API_VERSION` (Studio client, and the `auto-redirect` Function via `@/utils/constant`) uses the same constant. Raise to medium.

### AUD-058 Inline-image alt/caption not Markdown-escaped

Sources:
- https://spec.commonmark.org/0.31.2/ §2.4 — "Any ASCII punctuation character may be backslash-escaped" — confirms escaping `[` and `]` is legal.
- Same spec §6.3/§6.4: "A link text consists of a sequence of zero or more inline elements enclosed by square brackets (`[` and `]`)." … image description: "The rules for this are the same as for link text … When an image is rendered to HTML, this is standardly used as the image's `alt` attribute." — confirms that unbalanced brackets in alt break the image.

Verdict: confirms, with a nuance: the audit's example `"Chart [Q1]"` is a matched pair, which CommonMark tolerates inside link text ("Brackets are allowed in the link text only if (a) they are backslash-escaped or (b) they appear as a matched pair"); an unmatched `]` or `[` is the breaking case. `escapeMarkdown` (`portable-text-to-markdown.ts:108`) already escapes both, so routing `alt` and `caption` at lines 219-227 through it is the right fix.

### AUD-059 Heading slugs strip every non-ASCII character

Sources:
- slugify README (https://github.com/simov/slugify) — "Coerces foreign symbols to their English equivalent (check out the charMap for more details)" … "Out of the box `slugify` comes with support for a handful of Unicode symbols. For example the `☢` (radioactive) symbol is not defined in the charMap and therefore it will be stripped by default" — adds nuance: transliteration happens before `remove`, so Latin-transliterable scripts survive.
- Live run against installed slugify 1.6.9 with the repo's exact options (`{lower:true, remove:/[^a-zA-Z0-9 ]/g}`): `"Привет мир"` → `"privet-mir"`, `"مرحبا بالعالم"` → `"mrhba-balaalm"`, `"你好世界"` → `""`. With `{strict:true}`: identical results, CJK still `""`.

Verdict: partially contradicts. Cyrillic and Arabic headings do not get `id=""`; they are transliterated. Only scripts absent from slugify's charmap (CJK and others) collapse to `""`. `strict: true` does not fix that either. Keep the finding but narrow the problem statement to "scripts outside slugify's charmap" and drop `strict: true` from the fix; the index or hash fallback and dedupe pass are the parts that matter.

### AUD-060 `suppressHydrationWarning` on every Button

Sources:
- https://react.dev/reference/react-dom/components/common — "`suppressHydrationWarning`: A boolean. … If you set `suppressHydrationWarning` to `true`, React will not warn you about mismatches in the attributes and the content of that element. It only works one level deep, and is intended to be used as an escape hatch. Don't overuse it." — confirms.
- https://react.dev/reference/react-dom/client/hydrateRoot — "This only works one level deep, and is intended to be an escape hatch. Don't overuse it. React will **not** attempt to patch mismatched text content." — confirms; adds nuance that a real mismatch inside a button is silently left as server HTML rather than fixed.

Verdict: confirms.

### New findings from Sanity research

#### AUD-074 `auto-redirect` uses the deprecated `publish` event

- Severity: low. Area: studio, functions. Confidence: high (docs plus blueprint).
- Files: `apps/studio/sanity.blueprint.ts:24` (`on: ["publish"]`)
- Problem: the blueprint reference marks `publish` deprecated and tells you to use explicit events. The in-repo skill says the same ("Legacy `'publish'` is deprecated. Migrate to explicit events.").
- Scenario: a future `@sanity/blueprints` release drops the alias and `sanity blueprints deploy` fails, or the `includeAllVersions: true` shorthand triggers the function on every Content Release version edit (rate-limit exposure).
- Fix: `on: ["create", "update"]`. The handler's existing `if (!(slug && beforeSlug)) return` already handles the create case that the GROQ docs warn about.
- Source: https://www.sanity.io/docs/blueprints/blueprint-config — "publish (deprecated): Activates when a document is published. Essentially a shorthand for: create + update with includeAllVersions: true. Use explicit create/update events instead."

#### AUD-075 Function handlers mutate real data during local testing (no `context.local` guard)

- Severity: low. Area: studio, functions. Confidence: high.
- Files: `apps/studio/functions/auto-redirect/index.ts:59-64` (`client.create(redirect)`), `apps/studio/functions/invalidate-tags/index.ts:22-30` (POSTs to the live site and acks with `done()`)
- Problem: neither handler checks `context.local`. `sanity functions test auto-redirect --with-user-token --dataset production` creates a real `redirect` document; `functions test invalidate-tags` evicts the production cache.
- Scenario: a developer smoke-tests the function against `production` (the README's documented dataset) and leaves a stray redirect behind, or purges the live cache.
- Fix: `if (context.local) { logger.info("dry run", redirect); return; }` or `client.create(redirect, { dryRun: context.local })`; in `invalidate-tags`, log and return before the `fetch` when `context.local`.
- Source: https://www.sanity.io/docs/functions/function-wrapper — "**local** (boolean) The context.local value is set to true for functions invoked with sanity functions test and sanity functions dev. This can be helpful when you want code to only execute in local environments. It is undefined for functions in production."

#### Extensions to existing findings (not separate tickets)

- AUD-057: the dynamic API version also reaches the Studio client and the deployed `auto-redirect` Function through `apps/studio/utils/constant.ts:29-30`. Fold into AUD-057's fix (pin one literal date in `packages/env/src/constants.ts` and correct the comment and CLAUDE.md).
- AUD-014 and AUD-039: the first-class singleton API requires Studio 6.17.0 or newer. Target that version in the AUD-039 bump so AUD-014 can use `document: { singletons: [...] }` plus an `actions` filter for delete and unpublish.

Sources that could not be used: `https://www.npmjs.com/package/slugify` returned HTTP 403 (README read from GitHub raw instead); the old `sanity-io/sanity-plugin-mux-input` README is now a redirect stub; the next-sanity GitHub README no longer contains `defineLive` or `defineEnableDraftMode` content.

---

## CI and tooling findings: source backing

Scope: AUD-009, 037, 038, 040, 041, 042, 055, 066, 067, 068, 069. Official docs pages were fetched directly; local verification was run in the repo where the task asked for it.

Two things learned that change the picture:
- The Roboto Renovate preset (`local>robotostudio/.github`) sets `platformAutomerge: false`, `:automergeRequireAllStatusChecks`, and `minimumReleaseAge: "7 days"`, and pnpm 11 defaults `minimumReleaseAge` to 1440 minutes. So automerge already waits on every status check on the PR head (including Vercel's commit status), and the `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml` is active without the main key.
- Root `biome check .` fails today (7 errors), and root-level files are outside every CI gate because turbo's `lint` and `format:check` tasks only run package scripts. Written up as AUD-076.

### AUD-009 CI never runs the web build or a type-generation drift check

Sources:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches — "Required status checks must have a `successful`, `skipped`, or `neutral` status before collaborators can make changes to a protected branch." — confirms (a check must be marked required to gate; nothing gates by default).
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks — "A workflow is skipped by path filtering, branch filtering, or a commit message. Associated checks stay in a 'Pending' state and block merging." — adds nuance (a required check that never reports blocks the merge, so marking the Vercel deployment check required is safe even when Vercel skips).
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks — "A job that is skipped will report its status as 'Success'. It will not prevent a pull request from merging, even if it is a required check." — adds nuance: `e2e.yml` jobs are gated by `if:` conditions, so a job skipped by its `if:` reports Success and would pass a required-check rule.
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets — "Rulesets and branch protection rules can both protect branches in a repository. They work alongside each other, and all applicable rules are enforced." — confirms (empty rulesets plus a classic branch protection rule is a valid state; the audit could not see the classic rule's required checks).
- https://docs.renovatebot.com/key-concepts/automerge/ — "By default, Renovate will not automerge until it sees passing status checks / check runs for the branch." and "We strongly recommend you have tests in any project where you are regularly updating dependencies." — confirms the premise that automerge is only as safe as the checks that run.
- https://raw.githubusercontent.com/robotostudio/.github/main/default.json (the `local>robotostudio/.github` preset the repo extends last) — extends `":automergeRequireAllStatusChecks"`, sets `"platformAutomerge": false`, `"minimumReleaseAge": "7 days"`, and a `non-major` group with `"automerge": true`; `sanity`, `next-sanity`, `next`, `react`, `react-dom`, `react-is`, majors and pre-1.0 minors are `automerge: false` with `dependencyDashboardApproval`. — adds nuance: Renovate itself checks every status on the branch before merging, so a red Vercel commit status already blocks automerge; the risky window is a dependency that breaks something no check covers (type-gen drift, thumbnails).
- https://vercel.com/docs/git/vercel-for-github — "By default, git commits will receive a GitHub Commit Status for each project deployed by a commit." and "When projects are included in the consolidated commit status, they can also be configured as soft failures, so they do not block merges or fail the commit." — adds nuance: the Vercel status is a commit status (not a check run) and can be flipped to "soft failure" in the Vercel dashboard, which would silently un-gate the web build; that setting is outside the repo and unauditable from it.

Verdict: confirms. The web build is gated only indirectly (Renovate waits on Vercel's commit status; humans are not gated unless the classic branch protection rule lists it, which could not be confirmed). Nothing covers `schema.json`, `sanity.types.ts`, or thumbnail drift, and the Sanity TypeGen docs describe running `sanity schema extract && sanity typegen generate` as a pre-build step. The proposed `git diff --exit-code` job is the standard remedy. If the team relies on the Vercel status as the web-build gate, the ticket should record that the "soft failure" dashboard setting must stay off.

### AUD-037 No tests for the web app's HTTP surface, queries, env, or Studio logic

Sources:
- https://vitest.dev/guide/projects — "Vitest provides a way to define multiple project configurations within a single Vitest process. This feature is particularly useful for monorepo setups." — confirms a low-cost way to reach `apps/web`, `apps/studio`, `packages/*` from one runner.
- https://nextjs.org/docs/app/guides/testing/vitest — "Since `async` Server Components are new to the React ecosystem, Vitest currently does not support them. While you can still run **unit tests** for synchronous Server and Client Components, we recommend using **E2E tests** for `async` components." — adds nuance: the audit's proposed scope (pure helpers, route-handler internals, query parsing, env fixtures) is exactly what Next says Vitest can cover; page components themselves stay with Playwright.
- https://github.com/sanity-io/groq-js/blob/main/README.md — `parse()` "Returns an ESTree-inspired syntax tree". — confirms the "parse every exported `defineQuery`" test is feasible with `groq-js`.

Verdict: confirms.

### AUD-038 Renovate cap silently blocks `@sanity/ui` and `@sanity/icons` updates

Sources:
- https://docs.renovatebot.com/configuration-options/#allowedversions — "This option allows you to restrict the range of allowed versions for a dependency." and "This is not a substitute for matchCurrentVersion—use matchCurrentVersion if you want to filter based on the current version in your repository." — confirms: `allowedVersions: "<4"` filters candidate versions regardless of what is installed, so with `@sanity/ui ^4.0.6` and `@sanity/icons ^5.2.1` already in `apps/studio/package.json:30,32` no candidate ever qualifies.
- Local: CI builds the Studio green with `@robotostudio/sanity-plugin-lucide-icon-picker ^1.0.2`, so the rule's stated rationale ("sanity build fails with MISSING_EXPORT the moment either crosses") is already disproven by the repo itself.

Verdict: confirms. Delete the rule; keep the `@sanity/client <8` rule (still matches `next-sanity` 13.3.3's peer `@sanity/client ^7.26.2`).

### AUD-040 Biome warnings and import order are never enforced in CI

Sources:
- https://biomejs.dev/reference/cli/ — `biome check`: "Checks the specified files for formatting, linting, and assist actions." `biome lint`: "Runs the linter on the specified files". `--error-on-warnings`: "Exits with an error status if any warning diagnostics are emitted." — confirms that `lint` alone neither runs assist nor fails on warnings.
- https://biomejs.dev/assist/ — "by default, Biome enforces assists when running the `check` command." — confirms `organizeImports` is only enforced by `check`.
- https://biomejs.dev/recipes/continuous-integration/ and https://biomejs.dev/reference/cli/#biome-ci — `biome ci`: "Runs formatting checks, linting checks, and assist actions in CI without modifying files."; "Integrates better with specific runners. For example, when run on GitHub, the diagnostics are printed using the GitHub annotations." `--enforce-assist`: "Enforces assist actions and causes the command to fail if required actions are not applied. Defaults to `true`." — adds nuance: the documented CI command is `biome ci .`, not `biome check .`.
- Local verification: `biome lint .` exits 0 at the root; root `biome lint --error-on-warnings .` also exits 0 (zero warnings repo-wide today), but root `biome check .` exits 1 with 7 errors: `assist/source/organizeImports` in `packages/sanity-blocks/src/internal/mux-video.tsx:3`, `packages/sanity-blocks/src/internal/sanity-image.test.ts:1`, `packages/sanity-blocks/src/social-grid/index.tsx:1`, `packages/sanity-blocks/src/video-feature/index.tsx:1`, `packages/sanity/src/client.ts:1`, `packages/sanity/src/sanity.types.ts:4092`, plus `.github/renovate.json` unformatted. — confirms the import-order half is a live failure today; the warning half is latent.

Verdict: confirms. Prefer `biome ci .` over `biome check .`; add `--error-on-warnings` if the intent is that `warn` rules gate. Note that `apps/studio`'s `type` script runs `biome format --write` on `sanity.types.ts`, not `biome check --write`, so regenerating types will reintroduce the `organizeImports` error until that script changes.

### AUD-041 Studio tsconfig does not extend the shared base

Sources:
- https://www.typescriptlang.org/tsconfig/ (`extends`) — "The configuration from the base file are loaded first, then overridden by those in the inheriting config file." and "`files`, `include`, and `exclude` from the inheriting config file _overwrite_ those from the base config file". — confirms that extending `base.json` and keeping the Studio's own `include`, `exclude` and `paths` is safe.
- https://www.typescriptlang.org/tsconfig/ (`noUncheckedIndexedAccess`) — confirms the gap: `apps/studio/tsconfig.json` has `strict` but not this flag, while `packages/typescript-config/base.json` sets it.
- https://www.typescriptlang.org/tsconfig/ (`exactOptionalPropertyTypes`) — marked "Recommended: Yes". — adds nuance: `base.json` does not set it either, so it is not part of the Studio/base divergence; adopting it would be a repo-wide change.
- https://turborepo.dev/docs/guides/tools/typescript — each package extends the shared `@repo/typescript-config`. — confirms the monorepo convention the Studio breaks.

Verdict: confirms, with one practical nuance: `base.json` sets `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `declaration: true`, `declarationMap: true`, `incremental: false`; the Vite-built Studio needs `module: "Preserve"`, `moduleDetection: "force"`, `jsx: "preserve"` overrides (as `apps/web` overrides `nextjs.json`), so "extend base" means extend plus override, not replace.

### AUD-042 Playwright conditional skips silently shrink coverage

Sources:
- https://playwright.dev/docs/test-annotations — `test.skip()`: "Playwright does not run such a test. Use this annotation when the test is not applicable in some configuration." and "Playwright's built-in HTML reporter shows all annotations". — adds nuance: skips are visible in the HTML report (uploaded by `e2e.yml` with `if: always()`), but nothing turns them red.
- https://playwright.dev/docs/api/class-test — `test.skip(condition, description)`: "Test is marked as 'skipped' when the condition is `true`." — confirms the mechanism; there is no built-in "skip locally, fail in CI" mode, so the audit's `process.env.CI` branch is the idiomatic way.
- https://playwright.dev/docs/test-reporters — `github` reporter provides "automatic failure annotations when running in GitHub actions." — adds nuance: failures surface in the PR, skips do not.
- Local: `presentation-guardrails.spec.ts:148` already documents the alternative ("Annotated rather than skipped: `test.skip` here would abandon...").

Verdict: confirms. In CI the fixtures are a hard requirement, so converting to failures under `CI` matches the docs' model.

### AUD-055 Root `pnpm test:e2e` loses e2e env vars under turbo strict env mode

Sources:
- https://turborepo.dev/docs/reference/configuration — `envMode` default `"strict"`: "strict" filters environment variables to only those specified in `env` and `globalEnv` keys. `passThroughEnv`: "An allowlist of environment variables that should be made available to this task's runtime, even when in Strict Environment Mode." — confirms.
- https://turborepo.dev/docs/crafting-your-repository/using-environment-variables — "Strict Mode filters the environment variables available to a task's runtime to **only** those that are specified in the globalEnv and env keys in turbo.json." and "This means that tasks that do not account for all of the environment variables that they need are likely to fail." Framework Inference adds `NEXT_PUBLIC_*` to `env` for Next.js packages. — confirms; adds nuance that the missing set is exactly the non-prefixed ones: `CI`, `VERCEL_AUTOMATION_BYPASS_SECRET`, `SANITY_E2E_DATASET`, `SANITY_E2E_SESSION_TOKEN`, `SANITY_E2E_FUNCTIONS_DEPLOYED`, plus `GITHUB_RUN_ID`, `GITHUB_RUN_ATTEMPT`, `GITHUB_JOB`, `TEST_WORKER_INDEX` used in `presentation-fixtures.ts:59-70`.

Verdict: confirms. Since `test:e2e` is `cache: false`, `passThroughEnv` is the right key (no hashing value in `env`).

### AUD-066 Dead code and stale exports (dependency verdicts)

Sources:
- https://knip.dev/guides/handling-issues — "a surprising result is usually a real finding or a configuration gap, not a false positive to silence." and "In most cases you can add `entry` patterns manually". — confirms the approach.
- https://knip.dev/reference/plugins/sanity — default entries `sanity.config.{js,jsx,ts,tsx}`, `sanity.cli.{ts,js}`, `sanity.blueprint.{ts,js,json}`; "Custom `config` or `entry` options override default values, they are not merged." — adds nuance: `functions/**` and `migrations/**` are not entries, and the blueprint references functions as a string path, which knip cannot follow.
- https://www.sanity.io/docs/functions/function-quickstart — TypeScript functions "take advantage of the `documentEventHandler` helper function", imported from `@sanity/functions`. — confirms the functions are separate entrypoints that legitimately import `@sanity/functions`.

Local verification (`pnpm why`, grep):
- `@sanity/functions` (apps/studio): imported by `apps/studio/functions/invalidate-tags/index.ts:1` (`syncTagInvalidateEventHandler`) and `apps/studio/functions/auto-redirect/index.ts:2` (`documentEventHandler`). Verdict: **knip false positive**, caused by missing `entry` patterns.
- `react-is` (apps/studio and packages/sanity): no `react-is` import anywhere under `apps/` or `packages/`. `pnpm why react-is` shows `react-is@19.2.8` reached only via `@sanity/cli` peer variations, and `react-is@16.13.1` via `prop-types`/`hoist-non-react-statics`. None of `@sanity/cli`, `styled-components` or `next-sanity` list `react-is` as a peer. Verdict: **real unused direct dependency** in both packages. The Roboto Renovate preset groups `react-is` with `react`/`react-dom`, so the declaration looks deliberate (version lockstep), but the declared 19.x copy is not what the transitive consumers resolve, so it buys nothing.
- `tailwindcss` and `tw-animate-css` (packages/tailwind-config): the package contains only `src/utils.ts` and `postcss.config.mjs`; neither references them. The actual consumers are `packages/ui/src/styles/globals.css:1-2`, and `packages/ui/package.json` already lists both. Verdict: **real** for `tailwind-config`; safe to remove there as long as `packages/ui` keeps its own entries.

Verdict: confirms with the per-package split above.

### AUD-067 Studio field action and slug preview inconsistencies

Sources:
- No official documentation page for `document.unstable_fieldActions` was found. https://www.sanity.io/docs/studio/document-actions-api does not mention field actions.
- Installed type definitions: `apps/studio/node_modules/sanity/lib/validateDocument-7XErM0VG.d.ts:7861` `unstable_fieldActions?: DocumentFieldAction[] | DocumentFieldActionsResolver;` — confirms the audit's type point: `apps/studio/plugins/presentation-url.ts:31` types the resolver argument as `DocumentActionComponent[]`, but the API is `DocumentFieldAction[]` (with `DocumentFieldActionsResolverContext` providing `documentId`, `documentType`, `path`).

Verdict: confirms (type mismatch verified against the installed `sanity` types); no external doc exists for the `unstable_` API, so state that in the ticket.

### AUD-068 Test quality gaps in the existing suite

Sources:
- https://vitest.dev/guide/coverage — "By default, `v8` will be used."; install with `npm i -D @vitest/coverage-v8`; "To include uncovered files in the report, you'll need to configure `coverage.include`". — confirms the proposed setup.
- https://vitest.dev/config/coverage — `coverage.thresholds`: positive numbers set minimum percentages; `thresholds.autoUpdate`: "Update all threshold values...to configuration file when current coverage is better than the configured thresholds." — confirms a `lines` threshold is supported and ratchetable.
- https://github.com/vitejs/vite/commit/05302b07267f6b4f9dbeac5b1d73fcc3dc06d730 ("feat(config): warn features incompatible with native loader in bundle loader") — warning text: "(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite" with "`__dirname` (vite.config.js:3). Use `import.meta.dirname` instead". — confirms. Reproduced locally: `vitest run` in `packages/sanity-blocks` prints the warning for `vitest.config.ts:11:35`.
- https://nodejs.org/api/esm.html — `import.meta.dirname`: "Added in: v21.2.0, v20.11.0", "v24.0.0, v22.16.0: This property is no longer experimental." — confirms the replacement is stable on the repo's `engines.node >=24`.
- https://playwright.dev/docs/api/class-page#page-wait-for-timeout — "Never wait for timeout in production. Tests that wait for time are inherently flaky. Use Locator actions and web assertions that wait automatically." (wording confirmed through search results quoting the official page; the direct fetch truncated). — confirms the `presentation-inline-edit.spec.ts:102,134` items.

Verdict: confirms on all externally checkable points. The regex, fixture and duplicate-helper items are repo-internal.

### AUD-069 Documentation drift

Sources:
- Local: `CLAUDE.md:209` says "(all ten do)"; `packages/sanity-blocks/src/sanity-blocks.ts:25-37` lists eleven schemas. No `.nvmrc` or `.node-version`; `.npmrc` is empty; pnpm printed `[WARN] Unsupported engine: wanted: {"node":">=24"} (current: {"node":"v22.22.2"...})` and carried on. — confirms.
- https://github.com/nvm-sh/nvm/blob/master/README.md (.nvmrc) — "You can create a `.nvmrc` file containing a node version number ... in the project root directory". — confirms the fix.
- https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md — "The `node-version-file` input accepts a path to a file containing the version of Node.js to be used by a project, for example `.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`, or `package.json`." — adds nuance: CI (`ci.yml:31`, `e2e.yml:64`) hardcodes `node-version: 24.21.0` twice; a single `.nvmrc` with `node-version-file` gives one source of truth.
- https://pnpm.io/package_json — "Unless the user has set the `engineStrict` config flag (see settings), this field is advisory only". — confirms why the container ran on Node 22 despite `engines`; `engineStrict: true` in `pnpm-workspace.yaml` would make it fail fast.
- https://www.sanity.io/docs/apis-and-sdks/sanity-typegen — "Commit `schema.json` and `sanity.types.ts` to your repository. Both files are generated, but tracking them means every developer, CI job, and type check starts from the same types without running the CLI first." and the recommended `"typegen": "sanity schema extract && sanity typegen generate"` with `prebuild`. — confirms CLAUDE.md's "both, in that order" guidance, and backs the AUD-009 drift check.
- https://www.sanity.io/docs/functions/function-quickstart — "Once you're satisfied that the function works as expected, deploy it by deploying the blueprint stack" (`sanity blueprints deploy`). — confirms the README and CLAUDE.md gap on blueprint deployment and `auto-redirect`.

Verdict: confirms. Suggested wording for the ticket: add `.nvmrc` = `24.21.0`, switch both workflows to `node-version-file: .nvmrc`, set `engineStrict: true`, fix "ten" → "eleven", document `auto-redirect`, `sanity.blueprint.ts`, `migrations/`, and `sanity blueprints deploy`.

### New findings from CI research

#### AUD-076 Root-level files are outside every lint and format gate, and `biome check .` already fails

- Severity: medium. Area: CI, tooling. Confidence: high (reproduced).
- Files: `.github/renovate.json`, `biome.jsonc:30`, `turbo.json` (`lint`, `format:check` tasks), root `package.json` (no `lint` or `format` script of its own), `packages/sanity/src/sanity.types.ts:4092`, `apps/studio/package.json` (`type` script)
- Problem: root `pnpm lint` and `pnpm format:check` are `turbo run lint` and `turbo run format:check`, which only execute the per-package `biome lint .` and `biome format .` scripts in `apps/*` and `packages/*`. Files at the repo root (`.github/**`, `biome.jsonc`, `turbo.json`, `pnpm-workspace.yaml`, root `package.json`) are never checked. Running `biome check .` at the root today exits 1: `.github/renovate.json` is not formatted, six files fail `assist/source/organizeImports` (listed under AUD-040), and `biome.jsonc:30` reports "The use of the recommended field has been deprecated, and will removed in the next major version of Biome. Use preset instead." with the hint `biome migrate`. The generated `sanity.types.ts` is one of the six because the `type` script only runs `biome format --write`, not `biome check --write`.
- Failure scenario: a hand-edited `renovate.json` or `turbo.json` merges unformatted; when AUD-040's `biome ci` step is added it fails on the first run, and again after every `pnpm type`, until both are addressed.
- Fix: add a root step (`biome ci .`, per the Biome CI recipe) that covers the whole tree, run `biome migrate` for the deprecated `recommended` key, change the studio `type` script to `biome check --write ../../packages/sanity/src/sanity.types.ts`, and commit the one-time `biome check --write .` result. Land this together with AUD-040.
- Source: https://biomejs.dev/recipes/continuous-integration/; https://biomejs.dev/assist/; local `biome check .` output above.

#### AUD-077 Dead-code scanning is not repeatable: no knip config, and the Sanity plugin does not know about `functions/**` or `migrations/**`

- Severity: low. Area: tooling. Confidence: high.
- Files: repo root (no `knip.json`, `knip.jsonc` or `knip.ts`; `knip` is not in any `package.json`), `apps/studio/functions/*/index.ts`, `apps/studio/migrations/hero-media-type/index.ts`, `apps/studio/sanity.blueprint.ts`
- Problem: AUD-066's knip results came from an ad-hoc run. knip's Sanity plugin registers only `sanity.config.*`, `sanity.cli.*` and `sanity.blueprint.*` as entries, and the blueprint references functions as string paths, so every run will keep reporting `@sanity/functions` as unused and `functions/**` and `migrations/**` as unused files unless entries are declared.
- Failure scenario: someone acts on a future knip report and removes `@sanity/functions`, breaking `sanity blueprints deploy`.
- Fix: add `knip` as a root devDependency with a `knip.jsonc` workspace section for `apps/studio` declaring `entry: ["functions/*/index.ts", "migrations/*/index.ts"]`, then wire `knip` into CI once AUD-066's real items are cleaned up.
- Source: https://knip.dev/reference/plugins/sanity ("Custom `config` or `entry` options override default values, they are not merged."); https://knip.dev/guides/handling-issues.

#### Clarification for AUD-039: `minimumReleaseAgeExclude` without `minimumReleaseAge`

- https://pnpm.io/settings/dependency-resolution — `minimumReleaseAge`: "Default: **1440** (since v11), **0** (before v11)", "`minimumReleaseAge` defines the minimum number of minutes that must pass after a version is published before pnpm will install it. This applies to **all dependencies**, including transitive ones." `minimumReleaseAgeExclude`: "If you set `minimumReleaseAge` but need certain dependencies to always install the newest version immediately, you can list them under `minimumReleaseAgeExclude`."
- Verdict: the repo pins `pnpm@11.24.0`, so the effective `minimumReleaseAge` is 1440 minutes even though the key is absent, and the exclude entries in `pnpm-workspace.yaml` are active. Setting the key explicitly still documents intent and protects against a pnpm 10 fallback, but the current state is not "no soak". Renovate separately enforces `minimumReleaseAge: "7 days"` via the Roboto preset, which is the stronger of the two for bot PRs.

---
