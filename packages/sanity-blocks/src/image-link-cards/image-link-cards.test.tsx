import { ImageLinkCards } from "@workspace/sanity-blocks/image-link-cards/index";
import { renderToStaticMarkup } from "react-dom/server";

test("ImageLinkCards renders cards and links", () => {
  const html = renderToStaticMarkup(
    <ImageLinkCards
      title="Blocks"
      cards={[
        {
          _key: "card-1",
          title: "Hero",
          description: "Reusable homepage banner.",
          href: "https://example.com/hero",
        },
      ]}
    />,
  );

  expect(html).toMatch(/Blocks/);
  expect(html).toMatch(/Hero/);
  expect(html).toMatch(/Reusable homepage banner/);
});

test("ImageLinkCards renders cards without hrefs", () => {
  const html = renderToStaticMarkup(
    <ImageLinkCards
      cards={[
        {
          _key: "card-1",
          description: "Fallback card body.",
        },
      ]}
    />,
  );

  expect(html).toMatch(/Fallback card body\./);
});

test("ImageLinkCards renders with no cards", () => {
  const html = renderToStaticMarkup(<ImageLinkCards title="Cards later" />);

  expect(html).toMatch(/Cards later/);
});
