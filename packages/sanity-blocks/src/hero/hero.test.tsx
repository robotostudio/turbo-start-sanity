import { HeroBlock } from "@workspace/sanity-blocks/hero/index";
import { renderToStaticMarkup } from "react-dom/server";

test("HeroBlock renders the title and button content", () => {
  const html = renderToStaticMarkup(
    <HeroBlock
      badge="New"
      title="Ship shared Sanity blocks"
      richText={[
        {
          _type: "block",
          _key: "block-1",
          children: [
            { _type: "span", text: "Reusable frontend and schema code." },
          ],
        },
      ]}
      buttons={[
        {
          _key: "btn-1",
          href: "https://example.com",
          text: "Start now",
        },
      ]}
    />
  );

  expect(html).toMatch(/Ship shared Sanity blocks/);
  expect(html).toMatch(/Start now/);
  expect(html).toMatch(/New/);
});

test("HeroBlock renders without image when not provided", () => {
  const html = renderToStaticMarkup(<HeroBlock title="No image test" />);

  expect(html).toMatch(/No image test/);
});

// The leading hero's page-builder wrapper is `display: contents`, which
// measures 0x0 in the visual editing overlay. Both of the boxes it renders
// instead have to carry the attribute: one resolving to the page-builder array
// rather than the block makes that half refuse to drag.
test("leading HeroBlock puts the visual editing attribute on both boxes", () => {
  const html = renderToStaticMarkup(
    <HeroBlock dataSanity="drag-me" isFirst title="Pinned" />
  );

  expect(html.match(/data-sanity="drag-me"/g)).toHaveLength(2);
  // Anchored on the banner box's id, not its classes — it pins only from `lg`
  // up, so matching a bare `sticky` misses it.
  expect(html).toMatch(/<div[^>]*data-sanity="drag-me"[^>]*id="hero"/);
});
