import { SubscribeNewsletter } from "@workspace/sanity-blocks/subscribe-newsletter/index";
import { renderToStaticMarkup } from "react-dom/server";

test("SubscribeNewsletter renders text sections", () => {
  const html = renderToStaticMarkup(
    <SubscribeNewsletter
      action="/api/subscribe"
      method="post"
      title="Subscribe"
      subTitle={[
        {
          _type: "block",
          _key: "block-1",
          children: [{ _type: "span", text: "Product updates." }],
        },
      ]}
    />
  );

  expect(html).toMatch(/Subscribe/);
  expect(html).toMatch(/Product updates/);
  expect(html).toContain('action="/api/subscribe"');
  expect(html).toContain('method="post"');
});
