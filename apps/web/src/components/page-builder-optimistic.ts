import type {
  Page,
  PageBuilder as RawPageBuilder,
} from "@workspace/sanity/types";

import type { PageBuilderBlock } from "@/types";

type DeepPartial<T> = T extends readonly (infer Item)[]
  ? DeepPartial<Item>[]
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

type GeneratedPageBuilderBlock = RawPageBuilder[number];

export type RawPageBuilderBlock = DeepPartial<GeneratedPageBuilderBlock> &
  Pick<GeneratedPageBuilderBlock, "_key" | "_type">;

export type RawOptimisticPageBuilder = RawPageBuilderBlock[];

type PageBuilderField = Pick<Page, "pageBuilder">;

export type RawPageBuilderDocument = {
  readonly [Key in keyof PageBuilderField]?: RawOptimisticPageBuilder;
};

export type OptimisticPageBuilderAction = {
  readonly id: string;
  readonly document?: RawPageBuilderDocument | null;
};

const NO_SPECIAL_RECONCILIATION = Symbol("no-special-reconciliation");
const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isUnsafeObjectKey(key: string) {
  return UNSAFE_OBJECT_KEYS.has(key);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  value: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const field = value?.[key];
  return typeof field === "string" ? field : undefined;
}

function referenceId(value: Record<string, unknown> | undefined) {
  return (
    stringField(value, "_ref") ??
    stringField(value, "_id") ??
    (isObject(value?.document) ? stringField(value.document, "_id") : undefined)
  );
}

function findProjectedItem(
  currentItems: unknown[],
  rawItem: Record<string, unknown>
) {
  const rawKey = stringField(rawItem, "_key");
  const rawReference = stringField(rawItem, "_ref");

  return currentItems.find((item) => {
    if (!isObject(item)) {
      return false;
    }
    if (rawKey && stringField(item, "_key") === rawKey) {
      return true;
    }
    return rawReference && referenceId(item) === rawReference;
  });
}

function reconcileImage(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>,
  inArray: boolean
) {
  const asset = isObject(raw.asset) ? raw.asset : undefined;
  const id = stringField(asset, "_ref");
  if (!id) {
    return undefined;
  }

  const sameAsset = stringField(current, "id") === id;
  const image: Record<string, unknown> = { id };

  if (sameAsset) {
    for (const key of ["alt", "preview"]) {
      if (current?.[key] !== undefined) {
        image[key] = current[key];
      }
    }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (isUnsafeObjectKey(key)) {
      continue;
    }
    if (key === "asset" || (key === "_type" && !inArray && !current?._type)) {
      continue;
    }
    image[key] = reconcileValue(current?.[key], value, key, false);
  }

  return image;
}

function resolveRawHref(rawUrl: Record<string, unknown>) {
  const type = stringField(rawUrl, "type");
  if (type === "external") {
    return stringField(rawUrl, "external") ?? stringField(rawUrl, "href");
  }
  if (type !== "internal") {
    return stringField(rawUrl, "href");
  }
  return undefined;
}

function resolveOptimisticHref(
  current: Record<string, unknown> | undefined,
  rawUrl: Record<string, unknown>
) {
  return (
    resolveRawHref(rawUrl) ??
    (stringField(rawUrl, "type") === "internal"
      ? stringField(current, "href")
      : undefined)
  );
}

function reconcileButton(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>
) {
  const url = isObject(raw.url) ? raw.url : undefined;
  const resolvedHref = url ? resolveOptimisticHref(current, url) : undefined;

  if (!resolvedHref && !current) {
    return undefined;
  }

  const button: Record<string, unknown> = {
    href: resolvedHref ?? current?.href,
  };
  for (const key of ["_key", "_type", "text", "variant"] as const) {
    if (raw[key] !== undefined) {
      button[key] = raw[key];
    }
  }
  button.openInNewTab = url?.openInNewTab ?? false;
  return button;
}

function rawLinkSource(raw: Record<string, unknown>) {
  if (isObject(raw.customLink)) {
    return raw.customLink;
  }
  if (isObject(raw.url)) {
    return raw.url;
  }
  return undefined;
}

function reconcileDirectLink(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>
) {
  const href = resolveOptimisticHref(current, raw);
  if (!href && !current) {
    return undefined;
  }
  return {
    href: href ?? current?.href,
    openInNewTab: raw.openInNewTab ?? false,
  };
}

function reconcileReference(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>
) {
  const rawReference = stringField(raw, "_ref");
  if (!rawReference || referenceId(current) !== rawReference) {
    return undefined;
  }
  return current;
}

function reconcileArray(current: unknown, raw: unknown[], fieldName?: string) {
  if (raw.every((item) => !isObject(item))) {
    return raw;
  }

  const currentItems = Array.isArray(current) ? current : [];
  return raw.flatMap((rawItem) => {
    if (!isObject(rawItem)) {
      return [rawItem];
    }
    const currentItem = findProjectedItem(currentItems, rawItem);
    const reconciled = reconcileValue(currentItem, rawItem, fieldName, true);
    return reconciled === undefined ? [] : [reconciled];
  });
}

function reconcileSpecialObject(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>,
  fieldName?: string,
  inArray = false
) {
  if (isObject(raw.asset) || current?.id !== undefined) {
    return reconcileImage(current, raw, inArray);
  }
  if (fieldName === "buttons") {
    return reconcileButton(current, raw);
  }
  if (fieldName === "link" && stringField(raw, "type")) {
    return reconcileDirectLink(current, raw);
  }
  if (stringField(raw, "_ref")) {
    return reconcileReference(current, raw);
  }
  return NO_SPECIAL_RECONCILIATION;
}

function reconcileRawFields(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>
) {
  const reconciled: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (isUnsafeObjectKey(key)) {
      continue;
    }
    reconciled[key] = reconcileValue(current?.[key], value, key, false);
  }
  return reconciled;
}

function reconcileAliasedLinkObject(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>,
  linkSource: Record<string, unknown>
) {
  const resolvedHref = resolveOptimisticHref(current, linkSource);
  if (!resolvedHref && !current) {
    return undefined;
  }

  const reconciled = reconcileRawFields(current, raw);
  reconciled.href = resolvedHref ?? current?.href;
  reconciled.openInNewTab = linkSource.openInNewTab ?? false;
  return reconciled;
}

function reconcileObject(
  current: Record<string, unknown> | undefined,
  raw: Record<string, unknown>,
  fieldName?: string,
  inArray = false
) {
  const special = reconcileSpecialObject(current, raw, fieldName, inArray);
  if (special !== NO_SPECIAL_RECONCILIATION) {
    return special;
  }

  const linkSource = rawLinkSource(raw);
  if (linkSource) {
    return reconcileAliasedLinkObject(current, raw, linkSource);
  }

  return reconcileRawFields(current, raw);
}

function reconcileValue(
  current: unknown,
  raw: unknown,
  fieldName?: string,
  inArray = false
): unknown {
  if (Array.isArray(raw)) {
    return reconcileArray(current, raw, fieldName);
  }
  if (isObject(raw)) {
    return reconcileObject(
      isObject(current) ? current : undefined,
      raw,
      fieldName,
      inArray
    );
  }
  return raw;
}

export function reconcilePageBuilder(
  currentBlocks: PageBuilderBlock[],
  rawBlocks: RawOptimisticPageBuilder
): PageBuilderBlock[] {
  const reconciled = reconcileArray(currentBlocks, rawBlocks);
  return reconciled as PageBuilderBlock[];
}
