import { FeatureCardsWithIcon } from "@workspace/sanity-blocks/feature-cards-icon/index";
import { renderToStaticMarkup } from "react-dom/server";

test("FeatureCardsWithIcon renders the card list", () => {
  const html = renderToStaticMarkup(
    <FeatureCardsWithIcon
      title="Highlights"
      cards={[
        {
          _key: "card-1",
          icon: "boxes",
          title: "Reusable",
          richText: [
            {
              _type: "block",
              children: [
                { _type: "span", text: "One shared implementation." },
              ],
            },
          ],
        },
      ]}
    />,
  );

  expect(html).toMatch(/Highlights/);
  expect(html).toMatch(/Reusable/);
  expect(html).toMatch(/One shared implementation/);
});

test("FeatureCardsWithIcon renders with no cards", () => {
  const html = renderToStaticMarkup(
    <FeatureCardsWithIcon title="No cards yet" />,
  );

  expect(html).toMatch(/No cards yet/);
});
