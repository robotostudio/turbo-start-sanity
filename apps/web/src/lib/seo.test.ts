import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@workspace/env/client", () => ({
  env: { NEXT_PUBLIC_VERCEL_ENV: "development" },
}));

vi.mock("@workspace/sanity/query", () => ({
  queryGlobalSeoSettings: "*[_id == 'settings'][0]",
}));

const sanityFetchMetadata = vi.fn();

vi.mock("@workspace/sanity/live", () => ({
  getDynamicFetchOptions: async () => ({
    perspective: "published",
    stega: false,
  }),
  sanityFetchMetadata: (...args: unknown[]) => sanityFetchMetadata(...args),
}));

const { seoFromDocument } = await import("./seo");

describe("seoFromDocument", () => {
  beforeEach(() => {
    sanityFetchMetadata.mockResolvedValue({
      data: { siteTitle: "Turbo Start Sanity" },
    });
  });

  it("titles a missing document as not found and keeps it out of the index", async () => {
    const metadata = await seoFromDocument(null, {
      slug: "/this-page-does-not-exist-xyz",
    });

    expect(metadata.title).toBe("Page not found / Turbo Start Sanity");
    expect(metadata.robots).toBe("noindex, nofollow");
    expect(metadata.openGraph?.title).toBe("Page not found");
  });

  it("titles an existing document from its own fields", async () => {
    const metadata = await seoFromDocument(
      { title: "About", seoNoIndex: false },
      { slug: "/about" }
    );

    expect(metadata.title).toBe("About / Turbo Start Sanity");
    expect(metadata.robots).toBe("index, follow");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/about");
  });
});
