import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PricingPlans } from "./index";

describe("PricingPlans", () => {
  it("renders plan names, pricing, and features", () => {
    const html = renderToStaticMarkup(<PricingPlans plans={[{ name: "Free", price: "$0", features: ["Unlimited content"] }, { name: "Pro", price: "$49", featured: true, features: ["AI Assist"] }, { name: "Ultra", price: "Custom", features: ["Dedicated support"] }]} />);
    expect(html).toContain("Free");
    expect(html).toContain("Pro");
    expect(html).toContain("Ultra");
    expect(html).toContain("AI Assist");
  });
});
