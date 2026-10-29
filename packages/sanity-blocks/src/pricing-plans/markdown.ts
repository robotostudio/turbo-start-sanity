import { headingToMarkdown, joinSections, type MarkdownBlock, type MarkdownOptions } from "../internal/markdown";
import { escapeMarkdown } from "../internal/portable-text-to-markdown";

export function pricingPlansToMarkdown(block: MarkdownBlock, _options: MarkdownOptions): string {
  const plans = Array.isArray(block.plans) ? block.plans : [];
  const content = plans.map((plan) => {
    const features = Array.isArray(plan.features) ? plan.features.map((feature) => `- ${escapeMarkdown(feature)}`).join("\n") : "";
    return joinSections([`### ${escapeMarkdown(plan.name ?? "Plan")}`, escapeMarkdown(plan.description ?? ""), [plan.price, plan.priceSuffix].filter(Boolean).join(" "), features]);
  }).join("\n\n");
  return joinSections([headingToMarkdown(block.title, 2), escapeMarkdown(block.description ?? ""), content]);
}
