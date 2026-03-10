# AWS Deployment Architecture

## What we're working with

The repo is a `pnpm` + Turborepo monorepo. The deployable frontend lives in `apps/web` — Next.js 16.1.3, App Router, with at least one hard edge-runtime route (`/api/og`). Search runs through a pair of Next.js API routes that talk to OpenSearch (`/api/search`, `/api/blog/search`), and there's a protected reindex endpoint (`/api/search/reindex`) that a Sanity webhook will hit on publish. The Studio in `apps/studio` deploys separately — Sanity manages that hosting, so it's out of scope here.

---

## 1. Compute

**SST v3 + OpenNext** is the right call here.

I looked at the usual suspects before landing on this:

**Amplify Hosting** was the first thing I ruled out. It's improved but it still makes monorepo builds with custom build roots awkward, and more importantly, you don't get direct control over the underlying CloudFront distribution — which means you can't attach a WAF Web ACL to it. That's a dealbreaker for this project.

**ECS/Fargate** is valid if you're already running containers, but it's a lot of infrastructure to own for a Next.js site with no stateful background processes. Task definitions, ECR lifecycle, load balancer health checks — none of that buys us anything Lambda doesn't give us cheaper.

**Vercel** would be the obvious path of least resistance, but the ask here is AWS.

SST + OpenNext lands in the right spot. OpenNext handles the App Router packaging into Lambda-compatible outputs and keeps up with Next.js releases faster than any other open-source AWS adapter. SST gives us proper IaC and a CloudFront distribution we actually own. The `buildCommand` config on the `Nextjs` component takes any shell command, so `pnpm turbo run build --filter=web` just works.

One thing to check at deploy time: the `/api/og` edge route. OpenNext maps edge routes to Lambda@Edge or CloudFront Functions depending on the version. Next 16 is recent enough that this is worth verifying against the OpenNext changelog before assuming it works transparently. If there's a gap, the fallback is isolating that one route into a standalone CloudFront Function.

**Deployed stack:**

- CloudFront — single distribution, all traffic enters here
- S3 — static assets (`_next/static/`, public dir)
- Lambda (Node 22) — SSR pages and API routes
- Lambda@Edge / CloudFront Function — edge-runtime routes
- DynamoDB or S3 — ISR revalidation state managed by OpenNext internally
- Amazon OpenSearch Service — replaces the `docker-compose` OpenSearch used in local dev

---

## 2. CloudFront

One distribution, two origins:

- **Origin A** — S3 bucket (static assets)
- **Origin B** — Lambda function URL (Next.js server)

### Cache behaviors

| Path              | Origin      | TTL default / min / max | Notes                                                                                            |
| ----------------- | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `/_next/static/*` | S3          | 1y / 1d / 1y            | Build hashes fingerprint every file. Cache as long as CloudFront allows.                         |
| `/public/*`       | S3          | 1d / 1h / 7d            | No content hashing on these, so 1 day is a safe default.                                         |
| `/_next/image*`   | Next origin | 1d / 1min / 7d          | Next sets its own `Cache-Control` here — let it flow through.                                    |
| `/api/search*`    | Next origin | 1min / 0 / 5min         | Read-heavy and query-parametrised. Even a 60s edge cache takes real pressure off Lambda.         |
| `/api/*`          | Next origin | No cache                | Webhooks, reindex, auth — none of this should be cached at the edge.                             |
| `/*`              | Next origin | 5min / 0 / 1h           | ISR pages emit their own `s-maxage`. 5 minutes is a floor for anything that doesn't set headers. |

**A note on forwarding:** Static paths get no cookies, no query strings forwarded. For `/api/search*`, forward the full query string (`q`, `author`, `dateFrom`, `dateTo`, `limit`) — the cache key has to include those parameters or every user gets the same cached response. For everything else, forward only what the app actually reads. A promiscuous header forwarding policy tanks the cache hit rate.

Brotli + gzip enabled, HTTP → HTTPS redirect, HTTP/2 and HTTP/3 on.

---

## 3. WAF

AWS WAF v2 Web ACL attached directly to the CloudFront distribution. Rules run in priority order.

### Rate limiting on API routes

Scope-down to paths matching `/api/*`. Threshold: **1,200 requests per 5 minutes per IP** (~4 req/s sustained). Action: block, 5-minute window, auto-expires.

The threshold is genuinely a judgment call and I want to be honest about the trade-off:

- Go too tight — say, 200/5min — and you'll block real users behind a shared office NAT or a mobile carrier doing CGNAT. Expect a support ticket within the first week.
- Go too loose — 10k+ — and the rule is mostly cosmetic. It only catches the crudest scrapers and won't slow down anything targeted.

1,200/5min is a sensible starting point for an agency site at this traffic level. After the first month, pull the WAF logs, look at the 95th-percentile per-IP rate for legitimate users, and adjust. The rule is also there to protect Lambda concurrency and OpenSearch query load, not just to block bad actors.

### SQLi and XSS — managed rule groups

- `AWSManagedRulesCommonRuleSet` — covers the common XSS patterns and bad input signatures
- `AWSManagedRulesSQLiRuleSet` — SQL injection specific
- `AWSManagedRulesKnownBadInputsRuleSet` — known CVE exploit payloads (Log4Shell, Spring4Shell, etc.)

I'd enable these in **Count mode first**, run for a week, review what they'd have blocked, then flip to Block. Going straight to Block on a fresh deployment occasionally catches legitimate traffic — security scanner traffic from the client's own team being a classic example.

### IP reputation — third rule

`AWSManagedRulesAmazonIpReputationList` on Block. Catches traffic from known botnets, scanners, and C2 IPs. For an agency site it's essentially free protection with no tuning overhead.

Optionally layer `AWSManagedRulesAnonymousIpList` (TOR exit nodes, hosting-provider ranges, known anonymous proxies) — I'd ask the client about their audience first. Most B2B clients want this; some B2C clients don't.

---

## 4) Data flow and cache lifecycle

## Request/content flow

```mermaid
flowchart LR
  U[User Browser] --> CF[CloudFront + WAF]
  CF -->|static| S3[S3 Static Assets]
  CF -->|dynamic| NX[Next.js Compute on Lambda]
  NX --> SAN[Sanity Content API]
  NX --> OS[Amazon OpenSearch]

  ED[Content Editor in Sanity Studio] --> SAN
  SAN -->|Webhook: reindex| API1[/api/search/reindex/]
  API1 --> OS
  SAN -->|Webhook: revalidate| API2[/api/revalidate (recommended)/]
  API2 --> NX
  NX --> CF
```

### Where caching happens

1. **CloudFront edge cache**
   - Static assets: long-lived immutable cache
   - Search API + dynamic pages: short TTL or no-cache based on route
2. **Next.js data cache / ISR cache**
   - Route-level `revalidate` (already present in some API routes)
   - ISR artifacts stored in OpenNext-managed backing store
3. **Sanity CDN**
   - Sanity APIs/images already benefit from Sanity’s global CDN
4. **OpenSearch**
   - Query cache at index/search layer

### Stale content invalidation after publish

Recommended mechanism:

1. Sanity publish triggers webhook(s):
   - `POST /api/search/reindex` (already present in repo)
   - `POST /api/revalidate` (add token-protected endpoint)
2. Revalidate endpoint performs selective invalidation:
   - `revalidateTag()` for tag-based data dependencies
   - `revalidatePath()` for changed page paths (fallback)
3. CloudFront invalidation:
   - Prefer **targeted paths only** (e.g., updated blog slug, listing page)
   - Avoid blanket `/*` invalidations except emergency changes

---

## 5. IaC (SST v3)

This is illustrative — a real `sst.config.ts` would need proper stage handling, secrets referenced from SSM, and separate stacks for staging vs production.

```ts
// sst.config.ts
import { SSTConfig } from "sst";
import { Nextjs } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "agency-site",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const site = new Nextjs(stack, "Web", {
        path: "apps/web",
        buildCommand: "pnpm turbo run build --filter=web",
        environment: {
          NEXT_PUBLIC_SANITY_PROJECT_ID:
            process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
          OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
          SEARCH_REINDEX_SECRET: process.env.SEARCH_REINDEX_SECRET!,
        },
        cdk: {
          distribution: {
            // WAF ACL is deployed separately in us-east-1 (required for CloudFront WAF)
            // and its ARN is passed in via SSM or an env var
            webAclId: process.env.WAF_WEB_ACL_ARN,
          },
        },
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
```

The WAF ACL needs to live in a separate CDK/SST stack scoped to `us-east-1` — CloudFront WAFs must be in the global region. Pass its ARN into the main stack via SSM parameter or environment variable at deploy time.

---

## 6. Cost estimate — 10k monthly visitors

Assumes ~80% cache hit rate on pages, ~95% on static assets, moderate search usage, and a `t3.small.search` single-node OpenSearch domain.

| Service                                       | Monthly estimate   |
| --------------------------------------------- | ------------------ |
| CloudFront (data + requests)                  | $8 – $18           |
| Lambda invocations + duration                 | $3 – $12           |
| S3 (storage + requests)                       | $1 – $4            |
| WAF (Web ACL + managed rules + requests)      | $10 – $22          |
| Amazon OpenSearch (`t3.small.search`, 1 node) | $30 – $50          |
| CloudWatch, Secrets Manager, misc             | $3 – $8            |
| **Total**                                     | **~$55 – $115/mo** |

OpenSearch dominates at this traffic volume. If budget is tight, a single-node dev domain on `t3.small.search` without HA is acceptable for an agency site. Also worth noting: the app already has a Fuse.js fallback in `/api/search/route.ts` that kicks in if OpenSearch is unavailable, so there's a path to deferring OpenSearch costs initially if the client wants it.

---

## 7. Monitoring

CloudWatch alarms → SNS topic → Slack or PagerDuty.

**CloudFront:**

- `5xxErrorRate > 1%` for 5 minutes — something broke at the origin
- `CacheHitRate < 60%` sustained — likely a cache config regression or query strings bleeding into the cache key

**Lambda:**

- `Errors > 1%` of invocations — alarm immediately, this is user-facing
- `Duration p95 > 3s` — usually a slow Sanity or OpenSearch query; worth investigating before it worsens
- `Throttles > 0` — concurrency limit hit; needs a reserved concurrency adjustment

**WAF:**

- `BlockedRequests` spike > 5× baseline — could be an attack, or a false positive breaking user flows; both need eyes on it quickly

**OpenSearch:**

- `ClusterStatus.red` — critical, cluster is down
- `JVMMemoryPressure > 85%` for 10+ minutes — approaching GC pressure, needs instance resize or heap review
- `FreeStorageSpace < 20%` — add storage before it hits 10% and the cluster goes read-only automatically

**Synthetic canary (CloudWatch Synthetics):**

- Homepage returns HTTP 200 and contains expected content, every 5 minutes
- `/api/search?q=test` returns valid JSON with a `results` array, every 5 minutes

---

## 8. CI/CD

GitHub Actions, deploying via OIDC to avoid long-lived AWS credentials.

**On push to `main`:**

1. `pnpm install --frozen-lockfile`
2. `pnpm turbo run lint check-types build --filter=web`
3. Assume AWS deploy role via OIDC (no static access keys in the repo or Actions secrets)
4. `sst deploy --stage production`
5. POST `/api/health` smoke check against the production URL
6. If step 5 fails, `sst rollback --stage production` and alert

**On pull requests:** optionally deploy an ephemeral preview stack with `sst deploy --stage pr-{number}` and post the URL as a PR comment. Tear it down when the PR closes via a separate `sst remove` step in the `pull_request` closed event.

`SANITY_API_READ_TOKEN`, `SEARCH_REINDEX_SECRET`, and `SANITY_WEBHOOK_SECRET` live in AWS Secrets Manager, referenced by SSM parameter ARNs at deploy time — never in plaintext in the repository.

---

## 9. Summary

The stack is **SST + OpenNext + CloudFront + WAF + Amazon OpenSearch**. The choices come down to a few concrete things: Next 16 + edge runtime needs an adapter that tracks the framework closely, we need real CloudFront ownership for WAF attachment, and the OpenSearch client is already wired into the codebase so there's nothing to swap out.

Three things I'd want to verify before a client goes live: edge route compatibility in the OpenNext version at time of deploy, WAF rules in Count mode for a week before switching to Block, and the Sanity webhook setup for revalidation — the reindex half already exists in the repo, but the `/api/revalidate` endpoint still needs to be added.
