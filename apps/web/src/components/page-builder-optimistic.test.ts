import { describe, expect, test } from "vitest";

import type { PageBuilderBlock } from "@/types";
import { reconcilePageBuilder } from "./page-builder-optimistic";

function projectedBlocks(
  blocks: Array<Record<string, unknown>>
): PageBuilderBlock[] {
  return blocks as unknown as PageBuilderBlock[];
}

function resultBlock(blocks: PageBuilderBlock[], index: number) {
  return blocks[index] as unknown as Record<string, unknown>;
}

describe("reconcilePageBuilder", () => {
  test("applies raw ordering and edits without breaking projected images or buttons", () => {
    const current = projectedBlocks([
      {
        _key: "hero",
        _type: "hero",
        buttons: [
          {
            _key: "contact",
            _type: "button",
            href: "/contact/",
            openInNewTab: false,
            text: "Schedule a call",
            variant: "default",
          },
        ],
        image: {
          alt: "A family outside their home",
          id: "image-family-1200x900-jpg",
          preview: "data:image/jpeg;base64,preview",
        },
        title: "Original title",
      },
      {
        _key: "copy",
        _type: "richTextBlock",
        richText: [],
        title: "Supporting copy",
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "copy",
        _type: "richTextBlock",
        richText: [],
        title: "Supporting copy",
      },
      {
        _key: "hero",
        _type: "hero",
        buttons: [
          {
            _key: "contact",
            _type: "button",
            text: "Contact us",
            url: {
              _type: "customUrl",
              internal: { _ref: "contact-page", _type: "reference" },
              openInNewTab: false,
              type: "internal",
            },
            variant: "outline",
          },
        ],
        image: {
          _type: "image",
          asset: {
            _ref: "image-family-1200x900-jpg",
            _type: "reference",
          },
        },
        title: "Updated title",
      },
    ]);

    expect(reconciled).toEqual([
      {
        _key: "copy",
        _type: "richTextBlock",
        richText: [],
        title: "Supporting copy",
      },
      {
        _key: "hero",
        _type: "hero",
        buttons: [
          {
            _key: "contact",
            _type: "button",
            href: "/contact/",
            openInNewTab: false,
            text: "Contact us",
            variant: "outline",
          },
        ],
        image: {
          alt: "A family outside their home",
          id: "image-family-1200x900-jpg",
          preview: "data:image/jpeg;base64,preview",
        },
        title: "Updated title",
      },
    ]);
  });

  test("applies explicit field and block deletions", () => {
    const current = projectedBlocks([
      {
        _key: "hero",
        _type: "hero",
        image: { id: "image-old-800x600-jpg", preview: "old-preview" },
        title: "Keep this block",
      },
      {
        _key: "removed",
        _type: "richTextBlock",
        richText: [],
        title: "Remove this block",
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "hero",
        _type: "hero",
        title: "Keep this block",
      },
    ]);

    expect(reconciled).toEqual([
      {
        _key: "hero",
        _type: "hero",
        title: "Keep this block",
      },
    ]);
  });

  test("normalizes a new image without carrying metadata from the old asset", () => {
    const current = projectedBlocks([
      {
        _key: "hero",
        _type: "hero",
        image: {
          alt: "Old image",
          id: "image-old-800x600-jpg",
          preview: "old-preview",
        },
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "hero",
        _type: "hero",
        image: {
          _type: "image",
          alt: "New image",
          asset: {
            _ref: "image-new-1200x900-webp",
            _type: "reference",
          },
          hotspot: { x: 0.4, y: 0.6 },
        },
      },
    ]);

    expect(resultBlock(reconciled, 0).image).toEqual({
      alt: "New image",
      hotspot: { x: 0.4, y: 0.6 },
      id: "image-new-1200x900-webp",
    });
  });

  test("preserves projected links and images inside Portable Text", () => {
    const current = projectedBlocks([
      {
        _key: "copy",
        _type: "richTextBlock",
        richText: [
          {
            _key: "paragraph",
            _type: "block",
            children: [
              {
                _key: "span",
                _type: "span",
                marks: ["learn-more"],
                text: "Learn more",
              },
            ],
            markDefs: [
              {
                _key: "learn-more",
                _type: "customLink",
                customLink: {
                  internal: { _ref: "learn-more-page" },
                  openInNewTab: false,
                  type: "internal",
                },
                href: "/learn-more/",
                openInNewTab: false,
              },
            ],
          },
          {
            _key: "inline-image",
            _type: "image",
            alt: "A house",
            id: "image-house-900x600-jpg",
            preview: "house-preview",
          },
        ],
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "copy",
        _type: "richTextBlock",
        richText: [
          {
            _key: "paragraph",
            _type: "block",
            children: [
              {
                _key: "span",
                _type: "span",
                marks: ["learn-more"],
                text: "Read the details",
              },
            ],
            markDefs: [
              {
                _key: "learn-more",
                _type: "customLink",
                customLink: {
                  _type: "customUrl",
                  internal: {
                    _ref: "learn-more-page",
                    _type: "reference",
                  },
                  openInNewTab: false,
                  type: "internal",
                },
              },
            ],
          },
          {
            _key: "inline-image",
            _type: "image",
            asset: {
              _ref: "image-house-900x600-jpg",
              _type: "reference",
            },
          },
        ],
      },
    ]);

    const richText = resultBlock(reconciled, 0).richText as Array<
      Record<string, unknown>
    >;
    expect(richText[0]).toMatchObject({
      children: [{ text: "Read the details" }],
      markDefs: [
        {
          href: "/learn-more/",
          openInNewTab: false,
        },
      ],
    });
    expect(richText[1]).toEqual({
      _key: "inline-image",
      _type: "image",
      alt: "A house",
      id: "image-house-900x600-jpg",
      preview: "house-preview",
    });
  });

  test("reorders resolved FAQ references and omits newly unresolved references", () => {
    const current = projectedBlocks([
      {
        _key: "faqs",
        _type: "faqAccordion",
        faqs: [
          { _id: "faq-one", _type: "faq", richText: [], title: "First" },
          { _id: "faq-two", _type: "faq", richText: [], title: "Second" },
        ],
        title: "Questions",
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "faqs",
        _type: "faqAccordion",
        faqs: [
          { _key: "two", _ref: "faq-two", _type: "reference" },
          { _key: "new", _ref: "faq-new", _type: "reference" },
          { _key: "one", _ref: "faq-one", _type: "reference" },
        ],
        title: "Questions",
      },
    ]);

    expect(resultBlock(reconciled, 0).faqs).toEqual([
      { _id: "faq-two", _type: "faq", richText: [], title: "Second" },
      { _id: "faq-one", _type: "faq", richText: [], title: "First" },
    ]);
  });

  test("resolves external links and omits newly unresolved internal links", () => {
    const current = projectedBlocks([
      {
        _key: "cards",
        _type: "imageLinkCards",
        buttons: [],
        cards: [
          {
            _key: "purchase",
            _type: "imageLinkCard",
            description: "Purchase a home",
            href: "/purchase/",
            openInNewTab: false,
            title: "Purchase",
          },
        ],
        title: "Loan options",
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "cards",
        _type: "imageLinkCards",
        buttons: [
          {
            _key: "external",
            _type: "button",
            text: "External",
            url: {
              external: "https://example.com",
              openInNewTab: true,
              type: "external",
            },
          },
          {
            _key: "new-internal",
            _type: "button",
            text: "New internal",
            url: {
              internal: { _ref: "new-page", _type: "reference" },
              type: "internal",
            },
          },
        ],
        cards: [
          {
            _key: "purchase",
            _type: "imageLinkCard",
            description: "Updated description",
            title: "Buy a home",
            url: {
              internal: { _ref: "purchase-page", _type: "reference" },
              openInNewTab: false,
              type: "internal",
            },
          },
        ],
        title: "Loan options",
      },
    ]);

    expect(resultBlock(reconciled, 0).buttons).toEqual([
      {
        _key: "external",
        _type: "button",
        href: "https://example.com",
        openInNewTab: true,
        text: "External",
      },
    ]);
    expect(resultBlock(reconciled, 0).cards).toMatchObject([
      {
        _key: "purchase",
        description: "Updated description",
        href: "/purchase/",
        openInNewTab: false,
        title: "Buy a home",
      },
    ]);
  });

  test("preserves matched projected links that are authoritatively broken", () => {
    const current = projectedBlocks([
      {
        _key: "cta",
        _type: "cta",
        buttons: [
          {
            _key: "broken",
            _type: "button",
            href: null,
            text: "Broken button",
          },
        ],
        title: "Call to action",
      },
      {
        _key: "cards",
        _type: "imageLinkCards",
        cards: [
          {
            _key: "broken-card",
            _type: "imageLinkCard",
            description: "Broken card",
            href: null,
            title: "Broken card",
          },
        ],
        title: "Cards",
      },
    ]);

    const reconciled = reconcilePageBuilder(current, [
      {
        _key: "cta",
        _type: "cta",
        buttons: [
          {
            _key: "broken",
            _type: "button",
            text: "Still broken",
            url: {
              internal: { _ref: "missing-page", _type: "reference" },
              type: "internal",
            },
          },
        ],
        title: "Updated call to action",
      },
      {
        _key: "cards",
        _type: "imageLinkCards",
        cards: [
          {
            _key: "broken-card",
            _type: "imageLinkCard",
            description: "Updated broken card",
            title: "Still broken card",
            url: {
              internal: { _ref: "missing-card-page", _type: "reference" },
              type: "internal",
            },
          },
        ],
        title: "Cards",
      },
    ]);

    expect(resultBlock(reconciled, 0).buttons).toMatchObject([
      { _key: "broken", href: null, text: "Still broken" },
    ]);
    expect(resultBlock(reconciled, 1).cards).toMatchObject([
      {
        _key: "broken-card",
        description: "Updated broken card",
        href: null,
        title: "Still broken card",
      },
    ]);
  });
});
