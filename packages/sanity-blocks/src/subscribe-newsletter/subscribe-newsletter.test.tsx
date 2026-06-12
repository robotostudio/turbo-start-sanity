import { SubscribeNewsletter } from "@workspace/sanity-blocks/subscribe-newsletter/index";
import { renderToStaticMarkup } from "react-dom/server";

test("SubscribeNewsletter renders text sections", () => {
  const html = renderToStaticMarkup(
    <SubscribeNewsletter
      title="Subscribe"
      subTitle={[
        {
          _type: "block",
          children: [{ _type: "span", text: "Product updates." }],
        },
      ]}
    />,
  );

  expect(html).toMatch(/Subscribe/);
  expect(html).toMatch(/Product updates/);
});
