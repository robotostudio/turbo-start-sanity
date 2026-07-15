import { LogoCloud } from "@workspace/sanity-blocks/logo-cloud/index";
import { renderToStaticMarkup } from "react-dom/server";

test("LogoCloud renders the title and logos", () => {
  const html = renderToStaticMarkup(
    <LogoCloud
      logos={[
        {
          _key: "logo-1",
          image: { id: "image-abc123-200x80-png", alt: "Acme" },
          href: "https://example.com",
          openInNewTab: true,
        },
      ]}
      title="Used by teams"
    />
  );

  expect(html).toMatch(/Used by teams/);
  expect(html).toMatch(/alt="Acme"/);
  expect(html).toMatch(/href="https:\/\/example\.com"/);
  expect(html).toContain('target="_blank"');
});

test("LogoCloud renders logos without a link", () => {
  const html = renderToStaticMarkup(
    <LogoCloud
      logos={[
        {
          _key: "logo-1",
          image: { id: "image-def456-200x80-png", alt: "Beta" },
        },
      ]}
    />
  );

  expect(html).toMatch(/alt="Beta"/);
  expect(html).not.toContain("<a ");
});

test("LogoCloud renders nothing when there are no logos", () => {
  const html = renderToStaticMarkup(<LogoCloud title="Partners" />);

  expect(html).toBe("");
});
