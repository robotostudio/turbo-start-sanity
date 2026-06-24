import {
  getHref,
  IconBadge,
  portableTextToPlainText,
  renderButtons,
  renderOptionalHeading,
  renderPortableText,
} from "@workspace/sanity-blocks/internal/rendering";
import { DynamicIcon } from "lucide-react/dynamic";
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
        {
          url: {
            type: "external",
            external: "https://example.com/docs",
          },
        },
        {},
      ])}
    </>
  );

  expect(html).toContain('href="/features"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('href="https://example.com/docs"');
  expect(html).toContain(">https://example.com/docs<");
  expect(html).not.toContain("<span></span>");
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

test("icon mocks forward extra props", () => {
  const html = renderToStaticMarkup(
    <>
      <TriangleAlert
        aria-hidden="true"
        className="icon-stub"
        data-track="one"
      />
      <DynamicIcon
        aria-label="dynamic icon"
        className="dynamic-icon"
        data-track="two"
        name="boxes"
        size={20}
      />
    </>
  );

  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('class="icon-stub"');
  expect(html).toContain('data-track="one"');
  expect(html).toContain('aria-label="dynamic icon"');
  expect(html).toContain('class="dynamic-icon"');
  expect(html).toContain('data-track="two"');
});
