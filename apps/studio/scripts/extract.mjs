// Sets the flag sanity.cli.ts reads to stub lexorank during extraction.
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "sanity",
  ["schema", "extract", "--force", "--enforce-required-fields"],
  {
    env: { ...process.env, SANITY_SCHEMA_EXTRACT: "1" },
    shell: true,
    stdio: "inherit",
  }
);

process.exit(result.status ?? 1);
