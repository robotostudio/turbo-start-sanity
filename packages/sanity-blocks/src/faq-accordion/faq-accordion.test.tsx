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
      categories={[
        {
          _key: "cat-1",
          title: "General",
          faqs: [
            {
              _id: "faq-1",
              title: "How do I import schemas?",
            },
          ],
        },
      ]}
    />
  );

  expect(html).toMatch(/FAQs/);
  expect(html).toMatch(/How do I import schemas\?/);
  expect(html).toMatch(/All questions/);
});

test("FaqAccordion renders subtitle and faq trigger titles", () => {
  const html = renderToStaticMarkup(
    <FaqAccordion
      subtitle="Helpful answers"
      categories={[
        {
          _key: "cat-1",
          title: "General",
          faqs: [
            {
              _id: "faq-2",
              title: "Where do the answers render?",
              richText: [
                {
                  _type: "block",
                  _key: "block-1",
                  children: [
                    { _type: "span", text: "Inside the shared package." },
                  ],
                },
              ],
            },
          ],
        },
      ]}
    />
  );

  expect(html).toMatch(/Helpful answers/);
  // Accordion trigger title is always rendered (even when closed)
  expect(html).toMatch(/Where do the answers render\?/);
});

test("FaqAccordion defaults to the first category", () => {
  const html = renderToStaticMarkup(
    <FaqAccordion
      title="FAQs"
      categories={[
        {
          _key: "cat-1",
          title: "First Category",
          faqs: [{ _id: "faq-1", title: "First question" }],
        },
        {
          _key: "cat-2",
          title: "Second Category",
          faqs: [{ _id: "faq-2", title: "Second question" }],
        },
      ]}
    />
  );

  // Both category tabs are listed.
  expect(html).toMatch(/First Category/);
  expect(html).toMatch(/Second Category/);
  // Only the first (default) category's faqs are shown.
  expect(html).toMatch(/First question/);
  expect(html).not.toMatch(/Second question/);
  // The first category tab is marked active, the second inactive.
  expect(html).toMatch(/aria-pressed="true"/);
  expect(html).toMatch(/aria-pressed="false"/);
});

test("FaqAccordion renders with no categories", () => {
  const html = renderToStaticMarkup(<FaqAccordion title="No items yet" />);

  expect(html).toMatch(/No items yet/);
});
