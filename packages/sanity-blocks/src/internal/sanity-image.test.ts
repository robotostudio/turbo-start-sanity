import { resolveAssetId } from "@workspace/sanity-blocks/internal/sanity-image";

test("resolveAssetId returns the id for a valid canonical asset id", () => {
  const id = "image-abc123def456-1200x630-png";
  expect(resolveAssetId({ id })).toBe(id);
});

test("resolveAssetId normalizes a stray drafts. prefix to canonical form", () => {
  expect(resolveAssetId({ id: "drafts.image-abc123-200x80-png" })).toBe(
    "image-abc123-200x80-png"
  );
});

test("resolveAssetId returns null for missing or undefined ids", () => {
  expect(resolveAssetId(null)).toBeNull();
  expect(resolveAssetId(undefined)).toBeNull();
  expect(resolveAssetId({})).toBeNull();
  expect(resolveAssetId({ id: undefined })).toBeNull();
  expect(resolveAssetId({ id: null })).toBeNull();
  expect(resolveAssetId({ id: "" })).toBeNull();
});

test("resolveAssetId returns null for malformed ids", () => {
  // Missing dimensions/format, wrong prefix, missing the `x` separator, and a
  // drafts-prefixed non-image ref all fail full-shape validation.
  expect(resolveAssetId({ id: "image-abc" })).toBeNull();
  expect(resolveAssetId({ id: "not-an-image" })).toBeNull();
  expect(resolveAssetId({ id: "image-abc123-200-png" })).toBeNull();
  expect(resolveAssetId({ id: "drafts.nope" })).toBeNull();
});
