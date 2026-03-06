# Senior Backend Technical Test

Welcome to the Roboto Studio senior backend technical assessment. This test evaluates your ability to work with Next.js, Sanity CMS, third-party APIs, search infrastructure, and your approach to production architecture.

**Time:** 6-8 hours

## Setup

Before starting, follow the [installation instructions on the main branch](https://github.com/robotostudio/turbo-start-sanity/tree/main#getting-started) to get the project running locally.

Once you have the project running with sample content, you're ready to begin.

**A few things to note before you start:**

- This project uses **Next.js 16**, **pnpm workspaces**, and **Turborepo**. Some deployment platforms have limited support for this combination. Choosing how to handle this is part of the test.
- The existing `/api/og` route uses **Edge Runtime**. Depending on your deployment target, you may need to adapt this.
- The project currently uses a basic [Fuse.js](https://www.fusejs.io/) search implementation. You'll be replacing this.

---

## The Test

You have **three tasks** to complete. Each task has core requirements that you must deliver and stretch goals that are not required but will be evaluated if present.

### Task 1: Blog Search with OpenSearch

Replace the existing Fuse.js search with a proper search backend powered by [OpenSearch](https://opensearch.org/).

**Core requirements:**

- Set up an OpenSearch instance (locally via Docker, on AWS, or via another provider — your choice, but be prepared to justify it)
- Build an indexing pipeline that syncs Sanity blog content into OpenSearch. This must be a repeatable, production-viable approach — not a one-off data import script. Consider how content gets re-indexed when an editor publishes, updates, or deletes a post.
- Create a Next.js API route (`/api/search`) that queries OpenSearch and returns results
- Build a search UI on the blog index page. Results should update as the user types (debounced), and the experience should handle empty states, loading states, and errors gracefully.
- Consider what happens when OpenSearch is unavailable. Your application should degrade gracefully, not crash.

**Stretch goals:**

- Faceted search — filter results by category, author, or date range alongside free-text search
- Custom analysers for better relevance (synonyms, stemming, fuzzy matching)
- Sanity webhook for real-time index updates on content publish

**Resources:** [OpenSearch Documentation](https://opensearch.org/docs/latest/), [Docker Hub - OpenSearch](https://hub.docker.com/r/opensearchproject/opensearch)

---

### Task 2: AWS Architecture Document

Write a concise architecture document (`docs/aws-architecture.md`) explaining how you would deploy this application to AWS with CDN and firewall protection.

You do not need to actually deploy to AWS. We want to see that you understand the infrastructure, can make informed decisions, and can communicate them clearly. In an agency setting, this is the kind of document you'd write for a client proposal or a technical handover.

**Core requirements:**

Your document must cover:

1. **Compute** — How would you deploy this Next.js 16 application on AWS? What service would you use (Amplify, SST/OpenNext, ECS/Fargate, Lambda, something else) and why? Address the specific challenges of this project: Next.js 16, pnpm monorepo, Turborepo, Edge Runtime usage.

2. **CDN** — Describe your CloudFront configuration. Define the cache behaviours you'd set up for static assets, dynamic pages, API routes, and ISR content. What TTLs would you use for each and why?

3. **WAF** — Define the AWS WAF rules you'd attach to the CloudFront distribution. At minimum cover:
   - Rate limiting on API routes (define your thresholds and explain the trade-off between too aggressive and too lenient)
   - SQL injection and XSS protection (which AWS managed rule groups would you use?)
   - One additional rule of your choice (geo-blocking, bot detection, IP reputation — whatever you think is appropriate for an agency client site)

4. **Data flow** — How does content get from Sanity to your search index to the user? Where does caching happen at each layer? How would you invalidate stale content after a publish?

5. **Diagram** — Include a simple architecture diagram showing the request flow. Mermaid, ASCII art, Excalidraw export — we don't care about visual polish, we care about accuracy and completeness.

**Stretch goals:**

- Infrastructure as Code snippets (CDK, SST, Terraform, or CloudFormation) for any of the resources you describe
- Cost estimate for a typical agency client site (~10k monthly visitors)
- Monitoring and alerting strategy (what CloudWatch alarms would you set up?)
- CI/CD pipeline design for deploying to this infrastructure
- Cache invalidation strategy for when content editors publish changes

**What this tests:** The same AWS and infrastructure knowledge as a hands-on deployment, but through articulation. A senior engineer should be able to explain this clearly without needing to provision anything. This also tests technical writing, which matters when you're writing proposals and handover documents for clients.

---

### Task 3: Pokedex Feature

Build a Pokedex section within the application using the [PokeAPI](https://pokeapi.co/).

**Core requirements:**

- Create a `/pokedex` route with a paginated list of Pokemon
- Each entry should display: sprite, name, types, and base stats
- Fetch and include evolution chain data for each Pokemon. This requires aggregating data from multiple PokeAPI endpoints (`/pokemon`, `/pokemon-species`, `/evolution-chain`). Design an efficient data fetching strategy that doesn't hammer the API on every request.
- Implement server-side caching so the PokeAPI isn't hit on every page load (ISR, in-memory cache, or another approach — justify your choice)
- Create a detail page (`/pokedex/[name]`) with full stats, abilities, and the evolution chain
- Create a **custom Sanity input component** that lets content editors search for and select a Pokemon directly within the Studio, linking blog posts to Pokedex entries
- The Pokedex content should be searchable in your OpenSearch instance from Task 1 — a user searching for "fire" should find both blog posts about fire and fire-type Pokemon

**Stretch goals:**

- Type-based filtering on the Pokedex index page
- Visual evolution chain rendering (handle branching evolutions like Eevee)
- Side-by-side Pokemon comparison feature
- Aggressive local caching layer that respects the [PokeAPI fair use policy](https://pokeapi.co/docs/v2#fairuse)

**Resources:** [PokeAPI Documentation](https://pokeapi.co/docs/v2), [PokeAPI GraphQL](https://pokeapi.co/docs/graphql) (if you prefer)

---

## Submission

1. Fork this repository and complete the tasks
2. Deploy your solution to **Vercel** with a working environment
3. Ensure your `docs/aws-architecture.md` is committed to the repo
4. Book your follow-up interview at [cal.com/roboto/follow-up-interview](https://cal.com/roboto/follow-up-interview)
   - Include a link to your GitHub repository
   - Include a link to your live Vercel deployment
5. Come prepared to discuss:
   - Your search infrastructure choices and how your indexing pipeline works
   - Your AWS architecture document — we'll probe the decisions you made
   - Your caching strategy across the stack (CDN, server, API)
   - How your Pokedex data aggregation works and why you structured it that way
   - What you'd change or add given more time

---

## Evaluation Criteria

- **Architecture and decision-making** — How you structure services, why you chose specific tools, and how you handle failure modes. We care more about the reasoning than the specific choice.
- **Code quality** — Clean, typed, maintainable code with proper error handling and edge case coverage
- **Infrastructure knowledge** — Your AWS architecture document should demonstrate real understanding of CDN behaviours, WAF configuration, and deployment trade-offs — not just surface-level descriptions
- **Data pipeline design** — How content flows from Sanity to OpenSearch, how PokeAPI data is cached and aggregated, and how these systems interact
- **Security awareness** — WAF rule design, input validation, rate limiting rationale
- **Cross-feature integration** — The Pokedex is searchable in OpenSearch, blog posts link to Pokedex entries. We're looking at how you connect features, not just build them in isolation.
- **User experience** — Search feels fast, the Pokedex handles loading and error states, nothing is broken
- **Technical communication** — Your architecture document is clear, concise, and demonstrates depth

Good luck!
