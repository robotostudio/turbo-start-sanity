import { describe, expect, it } from "vitest";

import { internalPathOnly, isSafeHref, sanitizeHref } from "./safe-href";

describe("isSafeHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1#frag",
    "mailto:hello@example.com",
    "tel:+441234567890",
    "/about",
    "/",
    "#section",
  ])("allows %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "not a url",
  ])("rejects %s", (href) => {
    expect(isSafeHref(href.trim())).toBe(false);
  });
});

describe("sanitizeHref", () => {
  it("returns undefined for empty, null and undefined", () => {
    expect(sanitizeHref(undefined)).toBeUndefined();
    expect(sanitizeHref(null)).toBeUndefined();
    expect(sanitizeHref("")).toBeUndefined();
    expect(sanitizeHref("   ")).toBeUndefined();
  });

  it("trims and returns a safe href", () => {
    expect(sanitizeHref("  https://example.com  ")).toBe("https://example.com");
  });

  it("drops a javascript: url so the caller renders unlinked content", () => {
    expect(sanitizeHref("javascript:fetch('//evil')")).toBeUndefined();
  });

  it("drops a javascript: url that leans on leading whitespace to hide", () => {
    expect(sanitizeHref("\n javascript:alert(1)")).toBeUndefined();
  });
});

const BASE = "http://localhost:3000/api/disable-draft";

describe("internalPathOnly", () => {
  it.each([
    "/blog/hello",
    "/",
    "/blog?page=2#top",
    // Not off-origin, just similar-looking — the guard must not over-reject.
    "/vil.com",
    "/evil.com-review",
  ])("passes %j through", (path) => {
    expect(internalPathOnly(path, BASE)).toBe(path);
  });

  // The control characters arrive percent-encoded (`?slug=/%09/evil.com`) and
  // are decoded before the guard sees them; the browser then deletes them from
  // the Location header, leaving `//evil.com`.
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "",
  ])("rejects %j", (path) => {
    expect(internalPathOnly(path, BASE)).toBe("/");
  });

  it("falls back to / for missing values and an unusable base", () => {
    expect(internalPathOnly(null, BASE)).toBe("/");
    expect(internalPathOnly(undefined, BASE)).toBe("/");
    expect(internalPathOnly("/ok", "not-a-url")).toBe("/");
  });
});
