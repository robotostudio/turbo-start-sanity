import { SocialGrid } from "@workspace/sanity-blocks/social-grid/index";
import { renderToStaticMarkup } from "react-dom/server";

test("SocialGrid renders the header and social cards", () => {
  const html = renderToStaticMarkup(
    <SocialGrid
      eyebrow="Socials"
      socials={[
        {
          _key: "s1",
          platform: "reddit",
          label: "Reddit",
          href: "https://reddit.com/r/example",
          openInNewTab: true,
        },
        {
          _key: "s2",
          platform: "github",
          label: "GitHub",
          href: "https://github.com/example",
        },
      ]}
      subtitle="Join our community today and stay updated."
      title="Join our community"
    />
  );

  expect(html).toMatch(/Socials/);
  expect(html).toMatch(/Join our community/);
  expect(html).toMatch(/Join our community today and stay updated\./);
  expect(html).toMatch(/Reddit/);
  expect(html).toMatch(/GitHub/);
  expect(html).toMatch(/href="https:\/\/reddit\.com\/r\/example"/);
  expect(html).toContain('target="_blank"');
  expect(html).toContain("bg-accent-green");
});

test("SocialGrid renders a card without a link", () => {
  const html = renderToStaticMarkup(
    <SocialGrid
      socials={[{ _key: "s1", platform: "youtube", label: "YouTube" }]}
      title="Follow us"
    />
  );

  expect(html).toMatch(/YouTube/);
  expect(html).not.toContain("<a ");
});

test("SocialGrid renders nothing when there are no socials", () => {
  const html = renderToStaticMarkup(<SocialGrid title="Join our community" />);

  expect(html).toBe("");
});
