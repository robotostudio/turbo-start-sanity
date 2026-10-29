import { describe, expect, it } from "vitest";
import { pricingPlansToMarkdown } from "./markdown";

describe("pricingPlansToMarkdown", () => {
  it("returns empty output for an empty block", () => expect(pricingPlansToMarkdown({}, {})).toBe(""));
  it("serializes plans without leaking HTML", () => {
    const result = pricingPlansToMarkdown({ title: "Plans", plans: [{ name: "Free", price: "$0", features: ["A <feature>"] }] }, {});
    expect(result).toContain("## Plans");
    expect(result).toContain("A \\<feature\\>");
    expect(result).not.toMatch(/<\/?[A-Za-z]/);
  });
});
