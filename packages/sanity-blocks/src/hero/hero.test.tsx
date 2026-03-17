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
    />,
  );

  expect(html).toMatch(/Ship shared Sanity blocks/);
  expect(html).toMatch(/Start now/);
  expect(html).toMatch(/New/);
});

test("HeroBlock renders without image when not provided", () => {
  const html = renderToStaticMarkup(<HeroBlock title="No image test" />);

  expect(html).toMatch(/No image test/);
});
