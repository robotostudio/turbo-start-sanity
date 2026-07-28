import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";

import type { OptimisticPageBuilderAction } from "./page-builder-optimistic";

const optimisticState = vi.hoisted(() => ({
  action: undefined as OptimisticPageBuilderAction | undefined,
}));

vi.mock("@sanity/visual-editing/react", () => ({
  useOptimistic: (
    initialState: PageBuilderBlock[],
    reducer: (
      current: PageBuilderBlock[],
      action: OptimisticPageBuilderAction
    ) => PageBuilderBlock[]
  ) =>
    optimisticState.action
      ? reducer(initialState, optimisticState.action)
      : initialState,
}));

import type { PageBuilderBlock } from "@/types";
import { PageBuilder } from "./pagebuilder";

test("PageBuilder keeps projected media and links valid during an optimistic edit", () => {
  const block = {
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
      id: "image-abc123-1200x900-jpg",
      preview: "data:image/jpeg;base64,preview",
    },
    richText: [],
    title: "Original title",
  } as unknown as PageBuilderBlock;

  optimisticState.action = {
    document: {
      pageBuilder: [
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
              _ref: "image-abc123-1200x900-jpg",
              _type: "reference",
            },
          },
          richText: [],
          title: "Updated title",
        },
      ],
    },
    id: "homePage",
  };

  try {
    const html = renderToStaticMarkup(
      <PageBuilder id="homePage" pageBuilder={[block]} type="homePage" />
    );

    expect(html).toContain("Updated title");
    expect(html).toContain("Contact us");
    expect(html).toContain('href="/contact"');
    expect(html).toContain("A family outside their home");
    expect(html).not.toContain("Link Broken");
  } finally {
    optimisticState.action = undefined;
  }
});

test("PageBuilder keeps an authoritative broken link visible during an optimistic edit", () => {
  const block = {
    _key: "cta",
    _type: "cta",
    buttons: [
      {
        _key: "broken",
        _type: "button",
        href: null,
        text: "Broken pathway",
      },
    ],
    richText: [],
    title: "Original title",
  } as unknown as PageBuilderBlock;

  optimisticState.action = {
    document: {
      pageBuilder: [
        {
          _key: "cta",
          _type: "cta",
          buttons: [
            {
              _key: "broken",
              _type: "button",
              text: "Still broken",
              url: {
                _type: "customUrl",
                internal: { _ref: "missing-page", _type: "reference" },
                type: "internal",
              },
            },
          ],
          richText: [],
          title: "Updated title",
        },
      ],
    },
    id: "homePage",
  };

  try {
    const html = renderToStaticMarkup(
      <PageBuilder id="homePage" pageBuilder={[block]} type="homePage" />
    );

    expect(html).toContain("Updated title");
    expect(html).toContain("Link Broken");
  } finally {
    optimisticState.action = undefined;
  }
});

test("PageBuilder distinguishes an omitted page builder from an explicit deletion", () => {
  const block = {
    _key: "hero",
    _type: "hero",
    buttons: [],
    richText: [],
    title: "Keep projected content",
  } as unknown as PageBuilderBlock;

  try {
    optimisticState.action = {
      document: {},
      id: "homePage",
    };
    const preservedHtml = renderToStaticMarkup(
      <PageBuilder id="homePage" pageBuilder={[block]} type="homePage" />
    );
    expect(preservedHtml).toContain("Keep projected content");

    optimisticState.action = {
      document: { pageBuilder: [] },
      id: "homePage",
    };
    const deletedHtml = renderToStaticMarkup(
      <PageBuilder id="homePage" pageBuilder={[block]} type="homePage" />
    );
    expect(deletedHtml).not.toContain("Keep projected content");
  } finally {
    optimisticState.action = undefined;
  }
});
