import { RichTextBlock } from "@workspace/sanity-blocks/rich-text-block/index";
import { renderToStaticMarkup } from "react-dom/server";

test("RichTextBlock renders headings and body text", () => {
  const html = renderToStaticMarkup(
    <RichTextBlock
      title="Editorial body"
      richText={[
        {
          _type: "block",
          children: [{ _type: "span", text: "Structured text content." }],
        },
      ]}
    />,
  );

  expect(html).toMatch(/Editorial body/);
  expect(html).toMatch(/Structured text content/);
});
