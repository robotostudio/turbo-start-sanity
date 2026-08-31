# Turbo Start Sanity

A Sanity-driven Next.js starter built around a **page builder**: a page is an ordered array of typed content blocks. This glossary pins the language for how those blocks are modeled and how their data is rendered for different audiences.

## Language

**Page-builder block**:
One typed content unit in a page's `pageBuilder` array (e.g. `hero`, `faqAccordion`, `cta`). Authored in Sanity, rendered by the frontend.
_Avoid_: section, component, widget, module

**Surface**:
One serialization of a page-builder block's data for a specific audience. Three exist today: **HTML** (rendered React, for humans), **JSON-LD** (schema.org structured data embedded in the HTML page, for search crawlers), and **Markdown** (plain-text serialization at a separate URL, for LLMs/agents). One block's data, many surfaces. HTML and Markdown apply to every block; JSON-LD is **opportunistic** — only blocks that map to a real schema.org type carry it.
_Avoid_: format, representation, output — reserve "surface" for the audience-specific cut.

**Markdown twin**:
The Markdown **surface** of a whole page, served at a parallel `.md` URL (or via `Accept: text/markdown`). Kept `noindex` so it never competes with the canonical HTML in search — it is the AEO channel, advertised via a per-page `rel="alternate"` link and a site-level `/llms.txt` index.
_Avoid_: markdown page, .md route — those name the mechanism, not the concept.

## Flagged ambiguities

**SEO vs AEO** — kept distinct because they use opposite mechanisms:
- **SEO** (search-engine optimization): ranking the *indexed HTML page* in Google. Mechanism here is semantic HTML + JSON-LD emitted **into** the page. The FAQ block already does this (native `<details>` + `FAQPage` JSON-LD).
- **AEO** (answer-engine optimization): being cleanly consumed by LLMs / answer engines (ChatGPT, Perplexity, Google AI). Mechanism here is the **Markdown** surface, served at `.md` or `Accept: text/markdown`.
- A Markdown surface that is `noindex` contributes **nothing** to SEO. "Markdown for SEO" is a category error — Markdown serves AEO.
_Avoid_: using "SEO" to mean "machine-readable" in general.

## Example

> **Dev:** "Let's add JSON-LD to the hero block's Markdown surface for SEO."
> **Domain expert:** "Three things are crossed. JSON-LD and Markdown are different *surfaces* — JSON-LD goes inside the HTML page, Markdown is the separate `.md` twin. JSON-LD serves SEO; the Markdown twin serves AEO and is noindexed. And a hero has no schema.org type, so it has no JSON-LD surface at all — only HTML and Markdown."
