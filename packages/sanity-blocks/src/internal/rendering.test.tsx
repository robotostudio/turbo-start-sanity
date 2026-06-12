import {
  getHref,
  IconBadge,
  portableTextToPlainText,
  renderButtons,
  renderOptionalHeading,
  renderPortableText,
} from "@workspace/sanity-blocks/internal/rendering";
import { TriangleAlert } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

test("getHref handles empty, internal, and external URLs", () => {
  expect(getHref()).toBeUndefined();
  expect(
    getHref({
      type: "internal",
      internal: {
        slug: {
          current: "/shared-blocks",
        },
      },
    })
  ).toBe("/shared-blocks");
  expect(
    getHref({
      type: "internal",
      internal: {
        slug: {
          current: "shared-blocks",
        },
      },
    })
  ).toBe("/shared-blocks");
  expect(
    getHref({
      type: "internal",
      internal: {
        slug: {
          current: "///shared-blocks",
        },
      },
    })
  ).toBe("/shared-blocks");
  expect(
    getHref({
      type: "internal",
      internal: {
        slug: {
          current: null,
        },
      },
    })
  ).toBeUndefined();
  expect(
    getHref({
      type: "external",
      external: "https://example.com",
    })
  ).toBe("https://example.com");
  expect(
    getHref({
      type: "external",
    })
  ).toBeUndefined();
});

test("portable text helpers flatten and render images, headings, and empty blocks", () => {
  expect(portableTextToPlainText()).toBe("");
  expect(
    portableTextToPlainText([
      {
        _type: "image",
        caption: "Caption copy",
      },
      {
        _type: "image",
        alt: "Alt copy",
      },
      {
        _type: "image",
      },
      {
        _type: "block",
        children: [
          { _type: "span", text: "Hello " },
          { _type: "span", text: "world" },
        ],
      },
      {
        _type: "block",
        children: [{ _type: "span" }],
      },
      {
        _type: "block",
        children: null,
      },
    ])
  ).toBe("Caption copy Alt copy Hello world");

  const html = renderToStaticMarkup(
    <>
      {renderPortableText([
        {
          _type: "image",
          alt: "Inline image alt",
        },
        {
          _type: "image",
        },
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Heading copy" }],
        },
        {
          _type: "block",
          children: [{ _type: "span", text: "Body copy" }],
        },
        {
          _type: "block",
          children: [{ _type: "span", text: "   " }],
        },
        {
          _type: "block",
          children: [{ _type: "span" }],
        },
        {
          _type: "block",
          children: null,
        },
      ])}
    </>
  );

  expect(html).toBe(
    "<p>Inline image alt</p><h2>Heading copy</h2><p>Body copy</p>"
  );
});

test("renderButtons handles empty, linked, and fallback button states", () => {
  expect(renderToStaticMarkup(<>{renderButtons()}</>)).toBe("");

  const html = renderToStaticMarkup(
    <>
      {renderButtons([
        {
          text: "Read more",
          url: {
            type: "internal",
            internal: {
              slug: {
                current: "/features",
              },
            },
            openInNewTab: true,
          },
        },
        {},
      ])}
    </>
  );

  expect(html).toContain('href="/features"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noreferrer"');
  expect(html).toContain("<span>Button 2</span>");
});

test("renderOptionalHeading and IconBadge cover fallback output", () => {
  expect(
    renderToStaticMarkup(<>{renderOptionalHeading(undefined, "p")}</>)
  ).toBe("");

  const html = renderToStaticMarkup(
    <>
      {renderOptionalHeading("Section title", "h2")}
      {renderOptionalHeading("Question title", "h3")}
      {renderOptionalHeading("Eyebrow copy", "p")}
      <IconBadge />
      <IconBadge name="boxes" />
      <TriangleAlert size={24} />
    </>
  );

  expect(html).toContain("<h2>Section title</h2>");
  expect(html).toContain("<h3>Question title</h3>");
  expect(html).toContain("<p>Eyebrow copy</p>");
  expect(html).toContain('data-icon="triangle-alert"');
  expect(html).toContain('data-size="16"');
  expect(html).toContain('data-size="24"');
  expect(html).toContain("<span>boxes</span>");
});
