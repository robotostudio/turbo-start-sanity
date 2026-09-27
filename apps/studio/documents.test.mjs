import assert from "node:assert/strict";
import test from "node:test";
import { mainDocuments } from "./documents.ts";

const cases = [
  ["/", {}, '_type == "homePage" && _id == "homePage"', undefined],
  ["/blog", {}, '_type == "blogIndex"', undefined],
  [
    "/blog/new-post",
    { slug: "new-post" },
    '_type == "blog" && slug.current == $slug',
    { slug: "/blog/new-post" },
  ],
  [
    "/new-page",
    { pathSegments: ["new-page"] },
    '_type == "page" && slug.current == $slug',
    { slug: "/new-page" },
  ],
];

for (const [index, [path, params, filter, expectedParams]] of cases.entries()) {
  test(`${path}: an explicitly selected document bypasses main-document resolution`, () => {
    const resolver = mainDocuments[index];
    const context = { origin: "http://localhost:3000", path, params };
    const resolve = () =>
      resolver.resolve?.(context) ??
      (resolver.filter
        ? { filter: resolver.filter, params: resolver.params?.(context) }
        : undefined);

    globalThis.window = {
      location: { pathname: "/presentation/page/new-document" },
    };
    assert.equal(resolve(), undefined);

    globalThis.window.location.pathname = "/presentation";
    assert.deepEqual(resolve(), { filter, params: expectedParams });
  });
}
