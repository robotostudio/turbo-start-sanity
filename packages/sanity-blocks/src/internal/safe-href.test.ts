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
  it("passes a same-origin path through, query and hash included", () => {
    expect(internalPathOnly("/blog/hello", BASE)).toBe("/blog/hello");
    expect(internalPathOnly("/", BASE)).toBe("/");
    expect(internalPathOnly("/blog?page=2#top", BASE)).toBe("/blog?page=2#top");
  });

  it("rejects absolute and protocol-relative urls", () => {
    expect(internalPathOnly("https://evil.com", BASE)).toBe("/");
    expect(internalPathOnly("//evil.com", BASE)).toBe("/");
    expect(internalPathOnly("/\\evil.com", BASE)).toBe("/");
  });

  it("rejects control characters the browser strips from Location", () => {
    // `?slug=/%09/evil.com` decodes to these before the guard sees them; the
    // browser then deletes the control char, leaving `//evil.com`.
    expect(internalPathOnly("/\t/evil.com", BASE)).toBe("/");
    expect(internalPathOnly("/\n/evil.com", BASE)).toBe("/");
    expect(internalPathOnly("/\r/evil.com", BASE)).toBe("/");
  });

  it("does not over-reject paths that merely look suspicious", () => {
    expect(internalPathOnly("/vil.com", BASE)).toBe("/vil.com");
    expect(internalPathOnly("/evil.com-review", BASE)).toBe("/evil.com-review");
  });

  it("falls back to / for missing or unresolvable values", () => {
    expect(internalPathOnly(null, BASE)).toBe("/");
    expect(internalPathOnly(undefined, BASE)).toBe("/");
    expect(internalPathOnly("", BASE)).toBe("/");
    expect(internalPathOnly("/ok", "not-a-url")).toBe("/");
  });
});
