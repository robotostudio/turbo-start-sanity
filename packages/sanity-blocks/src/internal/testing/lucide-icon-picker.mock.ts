import {
  type IconName,
  iconNames,
} from "../../../node_modules/lucide-react/dynamic.mjs";

// The real plugin derives its guard from Lucide's own `iconNames` list, so
// building the mock from the same list keeps its accept/reject behaviour
// identical to production. The relative node_modules path sidesteps the
// vitest alias that swaps "lucide-react" for the render stubs.
const names: ReadonlySet<string> = new Set(iconNames);

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && names.has(value);
}
