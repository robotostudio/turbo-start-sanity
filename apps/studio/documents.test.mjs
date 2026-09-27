import assert from "node:assert/strict";
import test from "node:test";
import { mainDocuments } from "./documents.ts";

const cases = [
  ["/", "/", {}, '_type == "homePage" && _id == "homePage"', undefined],
  ["/blog", "/blog", {}, '_type == "blogIndex"', undefined],
  [
    "/blog/:slug",
    "/blog/new-post",
    { slug: "new-post" },
    '_type == "blog" && slug.current == $slug',
    { slug: "/blog/new-post" },
  ],
  [
    "/*pathSegments",
    "/new-page",
    { pathSegments: ["new-page"] },
    '_type == "page" && slug.current == $slug',
    { slug: "/new-page" },
  ],
];

for (const [route, path, params, filter, expectedParams] of cases) {
  test(`${path}: an explicitly selected document bypasses main-document resolution`, () => {
    const resolver = mainDocuments.find((entry) => entry.route === route);
    assert.ok(resolver);
    assert.equal(typeof resolver.resolve, "function");
    const context = { origin: "http://localhost:3000", path, params };
    const resolve = () => resolver.resolve(context);

    globalThis.window = {
      location: { pathname: "/presentation/page/new-document" },
    };
    assert.equal(resolve(), undefined);

    globalThis.window.location.pathname = "/presentation";
    assert.deepEqual(resolve(), { filter, params: expectedParams });
  });
}
