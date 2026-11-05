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

const { getNotFoundMetadata, seoFromDocument } = await import("./seo");

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

  it("keeps a homepage with no document titled by the site and indexable", async () => {
    const metadata = await seoFromDocument({}, { slug: "/" });

    expect(metadata.title).toBe("Turbo Start Sanity");
    expect(metadata.robots).toBe("index, follow");
  });
});

describe("getNotFoundMetadata", () => {
  beforeEach(() => {
    sanityFetchMetadata.mockReset();
  });

  it("suffixes the not-found title with the site title from published Settings", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: { siteTitle: "Acme" } });

    const metadata = await getNotFoundMetadata();

    expect(metadata.title).toBe("Page not found / Acme");
    expect(sanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "published" })
    );
  });

  it("falls back to the template name when Settings has no site title", async () => {
    sanityFetchMetadata.mockResolvedValue({ data: null });

    const metadata = await getNotFoundMetadata();

    expect(metadata.title).toBe("Page not found / Turbo Start Sanity");
  });
});
