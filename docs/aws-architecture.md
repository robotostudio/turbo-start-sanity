# AWS Architecture Document

## Purpose

This document describes how I would deploy the `turbo-start-sanity` application to AWS with CDN and firewall protection. It is written as a proposal / handover document rather than a step-by-step deployment guide.

## Scope and assumptions

- The public application is the Next.js app in `apps/web`.
- Content is managed in Sanity and fetched at runtime/build time.
- Search is backed by OpenSearch via the existing `@workspace/opensearch` package and `/api/search` + `/api/search/webhook` routes.
- The repo is a `pnpm` monorepo using Turborepo.
- The app includes at least one Edge Runtime route: `apps/web/src/app/api/og/route.tsx`.
- Traffic profile is an agency-style marketing/content site with roughly `10k` monthly visitors.

---

## Recommended deployment strategy

### Decision

I would deploy the Next.js app using **SST + OpenNext on AWS**, fronted by **CloudFront + AWS WAF**, with **Amazon OpenSearch Service** as the search backend.

### Why this option

`SST/OpenNext` is the best fit here because it handles the parts that are awkward in a raw AWS setup:

- **Next.js 16**: OpenNext is purpose-built to map modern Next.js output to AWS primitives.
- **pnpm monorepo + Turborepo**: the app can be built from the repository root using workspace-aware install/build commands, which avoids brittle post-build copy steps.
- **App Router + API routes**: server-rendered pages and route handlers map cleanly to Lambda origins behind CloudFront.
- **Static assets**: `/_next/static/*` and public assets are pushed to S3 automatically.
- **ISR / cache headers**: OpenNext preserves Next.js cache semantics better than a hand-rolled ECS reverse-proxy setup.

### Why not the alternatives

- **Amplify Hosting**: fast to start, but I would not choose it for this repo because monorepo control, custom CDN/WAF behavior, and infrastructure handover tend to be less explicit than an agency client usually wants.
- **ECS/Fargate**: good fallback for absolute runtime compatibility, but it is more operationally heavy for this traffic profile and gives up some of the cost/per-request efficiency of Lambda + CloudFront.
- **Pure Lambda without OpenNext**: too much custom plumbing for Next.js 16.

### Edge Runtime caveat

This project has an Edge route in `apps/web/src/app/api/og/route.tsx`.

My recommendation is:

1. **Primary plan**: keep the overall deployment on `SST/OpenNext`.
2. **Delivery guardrail**: run a proof-of-compatibility for the OG route early.
3. **Fallback if edge parity is incomplete**:
   - either convert that route to **Node runtime** and keep it in the main deployment, or
   - isolate OG image generation behind a small dedicated edge-compatible function.

For this specific app, I would usually accept converting OG generation to **Node runtime** if that removes deployment risk. It is not latency-critical in the same way as page HTML.

---

## High-level AWS architecture

```mermaid
flowchart LR
  U[User Browser] --> CF[CloudFront]
  CF --> WAF[AWS WAF]
  WAF --> S3[S3: _next/static + public assets]
  WAF --> APP[OpenNext / Lambda origins]
  APP --> SANITY[Sanity Content Lake / CDN]
  APP --> OS[Amazon OpenSearch Service]

  E[Content Editor] --> ST[Sanity Studio]
  ST --> SANITY
  SANITY --> WH[/api/search/webhook]
  WH --> APP
  APP --> OS
```

---

## Compute design

### Web application

Deploy `apps/web` using **OpenNext on Lambda** behind CloudFront.

Typical mapping:

- **S3** for static output (`/_next/static/*`, public assets)
- **Regional Lambda** for:
  - dynamic App Router pages
  - route handlers under `/api/*`
  - server-side rendering
- **CloudFront** as the single public endpoint

### Build strategy for this monorepo

Build from the repository root, not from `apps/web` directly.

Recommended CI build steps:

```bash
pnpm install --frozen-lockfile
pnpm turbo run build --filter=web
```

To reduce CI time and artifact size, I would use **Turborepo prune** or SST's build caching in the pipeline:

```bash
pnpm turbo prune web --docker
```

### Studio deployment

I would keep **Sanity Studio** separate from the main AWS runtime.

Two reasonable options:

- **Preferred**: use Sanity-hosted Studio with a custom subdomain
- **Alternative**: deploy Studio as a separate static/Vite app on S3 + CloudFront or Amplify

This keeps the public website deployment simpler and separates editorial tooling from the visitor path.

### Search backend

Use **Amazon OpenSearch Service** (managed domain) rather than OpenSearch Serverless for this client profile.

Reason:

- lower and more predictable cost at `~10k` monthly visitors
- compatible with the existing OpenSearch client package
- easier to size small for an agency content/search workload

I would place the OpenSearch domain in **private subnets** and only allow access from the application runtime security group.

---

## CloudFront design

CloudFront should have separate behaviors because this app mixes immutable assets, dynamic HTML, API routes, and generated images.

### Cache behaviors

| Path pattern                                                 | Origin    |       Cache policy |                           TTL | Why                                                                         |
| ------------------------------------------------------------ | --------- | -----------------: | ----------------------------: | --------------------------------------------------------------------------- |
| `/_next/static/*`                                            | S3        |   aggressive cache |                      `1 year` | content-hashed assets are immutable                                         |
| `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, public assets | S3/Lambda |     standard cache |           `1 hour` to `1 day` | low change frequency, safe to cache                                         |
| `/_next/image*`                                              | Lambda    | query-string aware | `1 hour` default, `1 day` max | optimized images are expensive enough to cache, but may change with content |
| `/api/og*`                                                   | Lambda    | query-string aware |                       `1 day` | OG images are good CDN candidates and can be invalidated on publish         |
| `/api/navigation*`                                           | Lambda    |        short cache |                   `5 minutes` | route already declares `revalidate = 360`; this aligns with origin intent   |
| `/api/search*` and `/api/blog/search*`                       | Lambda    |           no cache |                           `0` | search is query-driven and freshness matters more than cache hit ratio      |
| `/api/search/webhook*`                                       | Lambda    |           no cache |                           `0` | webhook endpoints must never be cached                                      |
| `/api/disable-draft*`, `/api/presentation-draft*`            | Lambda    |           no cache |                           `0` | preview/editor routes must be dynamic                                       |
| `/*` (HTML / RSC / SSR pages)                                | Lambda    |  origin-controlled | `0 default`, honor `s-maxage` | lets Next/OpenNext control SSR vs ISR behavior                              |

### Cache policy notes

#### Static assets

- Enable Brotli + gzip compression.
- Forward **no cookies** and **minimal headers**.
- Use a long TTL because filenames are content-hashed.

#### Dynamic pages

- Default CloudFront TTL should be low (`0`) so the app can control caching through response headers.
- If ISR is introduced or expanded, CloudFront should respect `Cache-Control: s-maxage=... stale-while-revalidate=...` from the origin.

#### API routes

- `/api/search` should not be cached at CloudFront because:
  - responses vary heavily by query string
  - the OpenSearch index is updated in near real time
  - stale search responses are worse UX than a cache miss for this traffic level

#### ISR content

For ISR pages, I would use:

- `s-maxage=300` for page HTML that changes a few times per day
- `stale-while-revalidate=86400` for resilience during regeneration

That gives editors a fast publish-to-live path without putting the entire site into fully uncached SSR mode.

---

## AWS WAF design

Attach **AWS WAF** to the CloudFront distribution.

### Managed rule groups

I would enable these managed groups globally:

1. **`AWSManagedRulesCommonRuleSet`**
   - baseline protection for common web exploits
   - includes protections that help with XSS-style payloads and malformed requests

2. **`AWSManagedRulesSQLiRuleSet`**
   - explicit SQL injection detection
   - even though this app is not directly SQL-backed at the edge, it is still valuable defense-in-depth for APIs

3. **`AWSManagedRulesKnownBadInputsRuleSet`**
   - blocks common exploit payloads and request patterns associated with XSS and injection attempts

### Rate limiting on API routes

I would scope rate limiting more tightly to API paths rather than the entire site.

#### Proposed thresholds

- **`/api/search*`**: `300 requests / 5 minutes / IP`
- **all other `/api/*` public routes**: `100 requests / 5 minutes / IP`
- **preview / draft routes** (`/api/disable-draft*`, `/api/presentation-draft*`): `30 requests / 5 minutes / IP`

#### Trade-off explanation

- **Too aggressive**: shared office IPs, mobile carriers, QA teams, or fast search typing can trigger false positives.
- **Too lenient**: search scraping, brute-force request floods, and bot abuse become cheap.

For this site, `300 / 5 min / IP` on search is a good starting point because the search UI is debounced, but not every user comes from a unique IP. I would monitor 429/WAF block metrics after launch and tune from real traffic.

### Additional rule of choice

I would add **`AWSManagedRulesAmazonIpReputationList`**.

Reason:

- low-effort protection against traffic from known abusive or suspicious IP sources
- good default for an agency client site where the biggest risk is opportunistic scanning and bot traffic, not targeted nation-state traffic

### Optional extra protection

If the client sees scraping or high bot traffic, I would add **Bot Control** specifically on `/api/search*` rather than site-wide to keep cost contained.

---

## Data flow and cache flow

### Publish/update flow

1. Editor publishes content in **Sanity**.
2. Sanity stores the content in the Content Lake.
3. Sanity sends a webhook to `POST /api/search/webhook`.
4. The Next.js app:
   - validates the webhook secret
   - fetches the full blog document from Sanity
   - upserts or deletes the corresponding document in OpenSearch
5. Search results become near-real-time from the OpenSearch side.

### Read flow for a visitor

1. User hits the site through **CloudFront**.
2. **WAF** evaluates the request.
3. Request is served from:
   - **S3** for static assets, or
   - **Lambda/OpenNext** for HTML/API routes
4. For content pages, the app fetches content from **Sanity**.
5. For search, `/api/search` queries **OpenSearch** first, with a fallback to Sanity if OpenSearch is unavailable.
6. Response is cached according to the behavior rules above.

### Where caching happens

| Layer           | What caches there                                 | Notes                                |
| --------------- | ------------------------------------------------- | ------------------------------------ |
| Browser         | static assets, some HTML                          | based on response headers            |
| CloudFront      | static assets, OG images, selected APIs, ISR HTML | main CDN layer                       |
| S3              | static build output storage                       | not an HTTP cache, but static origin |
| Lambda/OpenNext | Next.js internal caching / ISR semantics          | depends on route configuration       |
| Sanity CDN      | Sanity-side content delivery when enabled         | good for read-heavy content queries  |
| OpenSearch      | index storage, not CDN cache                      | near-real-time search backend        |

### Invalidation strategy after publish

The current repo already supports **search index freshness** via `/api/search/webhook`.

For page freshness, I would add a second publish webhook for **cache revalidation**:

- webhook target: `/api/revalidate`
- payload: document type + slug + cache tags
- action:
  - call `revalidatePath()` / `revalidateTag()` for the changed page(s)
  - optionally invalidate CloudFront objects for:
    - `/sitemap.xml`
    - `/api/navigation`
    - `/api/og?...` for the changed slug

### Practical invalidation policy

- **Search index**: update immediately via webhook
- **Changed blog page**: revalidate path/tag immediately
- **Blog index page**: revalidate because list ordering/count may change
- **Sitemap/navigation**: invalidate or revalidate on publish
- **Static assets**: no invalidation needed; use hashed filenames

---

## Monitoring and alerting

### CloudWatch alarms

I would set alarms for:

#### CloudFront

- `5xxErrorRate > 1% for 5 minutes`
- sudden drop in cache hit ratio
- spike in total requests (possible abuse or campaign traffic)

#### Lambda / OpenNext

- `Errors > 0` for critical functions over `5 minutes`
- `Duration p95` above agreed threshold (for example `> 2s`)
- throttles > `0`

#### OpenSearch

- cluster status not green/yellow as expected
- JVM / CPU pressure
- high search latency
- storage pressure / free space threshold

#### WAF

- sudden spike in blocked requests
- rate-limit rule matches above baseline

### Logging

- **CloudFront standard logs** to S3
- **WAF logs** to Kinesis Firehose / S3
- **Lambda logs** to CloudWatch Logs
- application-side structured logs for:
  - search failures
  - webhook failures
  - Sanity fetch failures

### Operational dashboards

One shared dashboard should show:

- traffic volume
- cache hit ratio
- WAF blocks by rule
- Lambda errors/duration
- search API latency/error rate
- OpenSearch cluster health

---

## CI/CD pipeline design

I would use **GitHub Actions** because the repo already includes GitHub workflows.

### Pipeline stages

1. **Install**
   - `pnpm install --frozen-lockfile`
2. **Static validation**
   - lint
   - typecheck
3. **Build**
   - `pnpm turbo run build --filter=web`
4. **Package / deploy**
   - deploy SST/OpenNext stack to target AWS account
5. **Post-deploy smoke tests**
   - homepage 200
   - `/api/navigation` 200
   - `/api/search?q=test` returns valid JSON
   - `/api/search/webhook` health endpoint 200

### Environment promotion

- **Preview / staging** per branch or per PR
- **Production** only from protected branch + manual approval

### Deployment credentials

Use **GitHub OIDC to AWS IAM Role** instead of long-lived AWS keys.

---

## Cost estimate (`~10k` monthly visitors)

This is a rough order-of-magnitude estimate for a small agency client site.

| Component                          |                                Estimated monthly cost |
| ---------------------------------- | ----------------------------------------------------: |
| CloudFront                         |                                            `$3 - $10` |
| S3 static asset storage + requests |                                             `$1 - $3` |
| Lambda / OpenNext compute          |                                            `$2 - $15` |
| AWS WAF                            | `$8 - $25` depending on rule count and request volume |
| OpenSearch managed domain          |          `$40 - $90` for a small production footprint |
| CloudWatch logs / metrics          |                                            `$5 - $15` |
| **Estimated total**                |                             **`~$60 - $160 / month`** |

### Cost notes

- The **search cluster is the largest line item**.
- If the site does not need advanced search, search cost can be reduced dramatically by switching to a simpler backend later.
- If traffic grows substantially, CloudFront and WAF scale well, but OpenSearch sizing should be reviewed first.

---

## Example IaC snippets

### Example: WAF + CloudFront in CDK (illustrative)

```ts
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

const webAcl = new wafv2.CfnWebACL(this, "SiteWebAcl", {
  defaultAction: { allow: {} },
  scope: "CLOUDFRONT",
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "site-web-acl",
    sampledRequestsEnabled: true,
  },
  rules: [
    {
      name: "AWSCommon",
      priority: 10,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "aws-common",
        sampledRequestsEnabled: true,
      },
    },
    {
      name: "AWSSQLi",
      priority: 20,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesSQLiRuleSet",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "aws-sqli",
        sampledRequestsEnabled: true,
      },
    },
    {
      name: "SearchRateLimit",
      priority: 30,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          limit: 300,
          aggregateKeyType: "IP",
          scopeDownStatement: {
            byteMatchStatement: {
              positionalConstraint: "STARTS_WITH",
              searchString: "/api/search",
              fieldToMatch: { uriPath: {} },
              textTransformations: [{ priority: 0, type: "NONE" }],
            },
          },
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "search-rate-limit",
        sampledRequestsEnabled: true,
      },
    },
  ],
});
```

### Example: OpenSearch domain (illustrative)

```ts
// Pseudocode-level example
const domain = new opensearch.Domain(this, "SearchDomain", {
  version: opensearch.EngineVersion.OPENSEARCH_2_17,
  capacity: {
    dataNodeInstanceType: "t3.small.search",
    dataNodes: 1,
  },
  ebs: {
    volumeSize: 20,
  },
  zoneAwareness: {
    enabled: false,
  },
  enforceHttps: true,
  nodeToNodeEncryption: true,
  encryptionAtRest: { enabled: true },
  vpc,
  securityGroups: [searchSecurityGroup],
});
```

---

## Delivery notes / risks

### Main risk

The only non-trivial deployment risk is **Edge Runtime compatibility** for the OG image route in a Next.js 16 app.

### Mitigation

Run a short spike before production cutover:

- verify `api/og` behavior under the chosen OpenNext version
- if needed, switch that route to Node runtime or isolate it

### Why this is acceptable

It is a single route, not the core page delivery path, so it should not block the overall AWS architecture choice.

---

## Final recommendation

For this application, I would propose:

- **Compute**: `SST/OpenNext` for `apps/web`
- **CDN**: `CloudFront` with behavior-specific TTLs
- **Firewall**: `AWS WAF` with Common, SQLi, Known Bad Inputs, IP reputation, and API rate limits
- **Search**: `Amazon OpenSearch Service` in private subnets
- **Content freshness**: keep the existing `/api/search/webhook`, and add a second revalidation webhook for pages and navigation
- **CI/CD**: GitHub Actions + AWS OIDC + staged deployments

This gives the client a deployment that is cost-aware, secure, CDN-optimized, and realistic for a small agency-managed site.
