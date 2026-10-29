import { Check } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

const pricingPlan = defineArrayMember({
  name: "pricingPlan",
  type: "object",
  fields: [
    defineField({ name: "name", title: "Plan name", type: "string", description: "The name shown at the top of this plan" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2, description: "A short explanation of who this plan is for" }),
    defineField({ name: "price", title: "Price", type: "string", description: "The price displayed for this plan, such as $0 or $49" }),
    defineField({ name: "priceSuffix", title: "Price suffix", type: "string", description: "Optional text after the price, such as / month or forever" }),
    defineField({ name: "buttonText", title: "Button text", type: "string", description: "The call to action shown on this plan" }),
    defineField({ name: "buttonHref", title: "Button link", type: "url", description: "Where the plan button should take visitors" }),
    defineField({ name: "featured", title: "Featured plan", type: "boolean", description: "Highlight this plan as the recommended option" }),
    defineField({ name: "features", title: "Included features", type: "array", description: "The list of features included with this plan", of: [{ type: "string" }] }),
  ],
  preview: { select: { title: "name", featured: "featured" }, prepare: ({ title, featured }) => ({ title: title ?? "Untitled plan", subtitle: featured ? "Featured pricing plan" : "Pricing plan", media: Check }) },
});

export const pricingPlansSchema = defineType({
  name: "pricingPlans",
  type: "object",
  description: "A three-column pricing comparison for free, paid, and premium plans",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string", description: "Optional small label above the pricing heading" }),
    defineField({ name: "title", title: "Title", type: "string", description: "The main heading for the pricing section" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, description: "Optional supporting text below the heading" }),
    defineField({ name: "plans", title: "Plans", type: "array", description: "The plans to compare; add free, pro, and ultra plans", of: [pricingPlan] }),
  ],
  icon: Check,
  preview: { select: { title: "title" }, prepare: ({ title }) => ({ title: title ?? "Pricing plans", subtitle: "Pricing Plans" }) },
});
