import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import * as lucideMock from "./lucide-react.mock";

const SRC_DIR = join(__dirname, "../..");
const LUCIDE_IMPORT = /import\s*\{([^}]+)\}\s*from\s*"lucide-react"/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function importedIcons(): Set<string> {
  const icons = new Set<string>();
  for (const file of sourceFiles(SRC_DIR)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(LUCIDE_IMPORT)) {
      const names = match[1] ?? "";
      for (const name of names.split(",")) {
        const identifier = name.replace(/\btype\b/, "").trim();
        if (identifier) {
          icons.add(identifier);
        }
      }
    }
  }
  return icons;
}

// A lucide icon that is imported by a component but missing from the mock
// resolves to `undefined`, and React fails the entire render with "Element
// type is invalid" — which reads as an unrelated component bug.
test("every lucide icon used in src is stubbed in the mock", () => {
  const missing = [...importedIcons()]
    .filter((icon) => !(icon in lucideMock))
    .sort();

  expect(missing).toEqual([]);
});
