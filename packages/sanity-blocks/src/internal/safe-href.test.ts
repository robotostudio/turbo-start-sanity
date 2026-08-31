import { describe, expect, it } from "vitest";

import { isSafeHref, sanitizeHref } from "./safe-href";

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
