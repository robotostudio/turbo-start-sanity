import { CTABlock } from "@workspace/sanity-blocks/cta/index";
import { renderToStaticMarkup } from "react-dom/server";

test("CTABlock renders primary content", () => {
  const html = renderToStaticMarkup(
    <CTABlock
      eyebrow="Contact"
      title="Launch with confidence"
      buttons={[{ _key: "btn-1", href: "/contact", text: "Contact us" }]}
    />,
  );

  expect(html).toMatch(/Launch with confidence/);
  expect(html).toMatch(/Contact us/);
});
