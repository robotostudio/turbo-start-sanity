# Third-party skill attribution

Several skills under `.agents/skills/` (symlinked from `.claude/skills/`) are vendored
from upstream repositories maintained by Vercel Labs, not authored in this repo. The
exact source path and content hash for each vendored skill is tracked in
[`skills-lock.json`](../../skills-lock.json) at the repo root.

| Skill | Upstream repo | License (as published upstream) |
| --- | --- | --- |
| `next-best-practices`, `next-cache-components`, `next-upgrade` | [vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) | No license file published upstream as of vendoring; used here for internal guidance only |
| `vercel-cli-with-tokens`, `vercel-composition-patterns`, `vercel-optimize`, `vercel-react-best-practices`, `vercel-react-view-transitions`, `web-design-guidelines`, `writing-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT (per upstream README) |

These files are reproduced/adapted from the sources above; all credit for their content
belongs to Vercel and the respective upstream contributors. If you update or re-sync a
vendored skill, update its entry in `skills-lock.json` accordingly.
