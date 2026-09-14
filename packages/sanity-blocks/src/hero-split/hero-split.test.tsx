import { HeroSplit } from "@workspace/sanity-blocks/hero-split/index";
import { renderToStaticMarkup } from "react-dom/server";

const IMAGE_ID = "image-abc123-1600x1200-jpg";

test("HeroSplit renders the heading, subtitle and image", () => {
  const html = renderToStaticMarkup(
    <HeroSplit
      image={{ id: IMAGE_ID, alt: "A desk" }}
      subtitle="Change pages without a deploy."
      title="Build pages faster"
    />
  );

  expect(html).toMatch(/<h1[^>]*>Build pages faster<\/h1>/);
  expect(html).toMatch(/Change pages without a deploy\./);
  expect(html).toMatch(/alt="A desk"/);
});

test("HeroSplit renders its buttons as links", () => {
  const html = renderToStaticMarkup(
    <HeroSplit
      buttons={[
        { _key: "b1", href: "/start", text: "Get started" },
        {
          _key: "b2",
          href: "/docs",
          text: "Read the docs",
          variant: "outline",
        },
      ]}
      title="Build pages faster"
    />
  );

  expect(html).toMatch(/href="\/start"[^>]*>Get started/);
  expect(html).toMatch(/href="\/docs"[^>]*>Read the docs/);
});

test("HeroSplit keeps the copy when no image is set", () => {
  const html = renderToStaticMarkup(<HeroSplit title="Build pages faster" />);

  expect(html).toMatch(/Build pages faster/);
  expect(html).not.toMatch(/<img/);
});
