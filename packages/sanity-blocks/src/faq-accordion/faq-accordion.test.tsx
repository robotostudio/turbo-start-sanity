import { FaqAccordion } from "@workspace/sanity-blocks/faq-accordion/index";
import { renderToStaticMarkup } from "react-dom/server";

test("FaqAccordion renders questions and optional link", () => {
  const html = renderToStaticMarkup(
    <FaqAccordion
      title="FAQs"
      link={{
        title: "All questions",
        href: "https://example.com",
      }}
      faqs={[
        {
          _id: "faq-1",
          title: "How do I import schemas?",
        },
      ]}
    />,
  );

  expect(html).toMatch(/FAQs/);
  expect(html).toMatch(/How do I import schemas\?/);
  expect(html).toMatch(/All questions/);
});

test("FaqAccordion renders subtitle and faq trigger titles", () => {
  const html = renderToStaticMarkup(
    <FaqAccordion
      subtitle="Helpful answers"
      faqs={[
        {
          _id: "faq-2",
          title: "Where do the answers render?",
          richText: [
            {
              _type: "block",
              children: [
                { _type: "span", text: "Inside the shared package." },
              ],
            },
          ],
        },
      ]}
    />,
  );

  expect(html).toMatch(/Helpful answers/);
  // Accordion trigger title is always rendered (even when closed)
  expect(html).toMatch(/Where do the answers render\?/);
});

test("FaqAccordion renders with no faqs", () => {
  const html = renderToStaticMarkup(<FaqAccordion title="No items yet" />);

  expect(html).toMatch(/No items yet/);
});
