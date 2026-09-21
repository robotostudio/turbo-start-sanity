// Sets the flag sanity.cli.ts reads to stub lexorank during extraction.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const cli = join(
  dirname(require.resolve("sanity/package.json")),
  "bin",
  "sanity"
);

const result = spawnSync(
  process.execPath,
  [cli, "schema", "extract", "--force", "--enforce-required-fields"],
  {
    env: { ...process.env, SANITY_SCHEMA_EXTRACT: "1" },
    stdio: "inherit",
  }
);

process.exit(result.status ?? 1);
