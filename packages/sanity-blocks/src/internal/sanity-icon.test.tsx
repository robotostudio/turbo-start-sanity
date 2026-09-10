import { SanityIcon } from "@workspace/sanity-blocks/internal/sanity-icon";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";

const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

beforeEach(() => {
  warnSpy.mockClear();
});

test("SanityIcon renders a valid Lucide name dynamically at 24px", () => {
  const html = renderToStaticMarkup(<SanityIcon icon="boxes" />);

  expect(html).toContain('data-icon="boxes"');
  expect(html).toContain('data-size="24"');
  expect(html).toContain("flex size-12 items-center justify-center");
  expect(html).toContain('aria-hidden="true"');
  expect(warnSpy).not.toHaveBeenCalled();
});

test("SanityIcon warns and renders the fallback for an invalid name", () => {
  const html = renderToStaticMarkup(<SanityIcon icon="not-a-real-icon" />);

  expect(html).toContain('data-icon="triangle-alert"');
  expect(html).toContain('data-size="24"');
  expect(html).not.toContain("not-a-real-icon");
  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(warnSpy).toHaveBeenCalledWith(
    '[SanityIcon] WARN: "not-a-real-icon" is not a Lucide icon name; rendering the fallback icon instead.'
  );
});

test("SanityIcon renders nothing for missing, null, or empty names", () => {
  expect(renderToStaticMarkup(<SanityIcon />)).toBe("");
  expect(renderToStaticMarkup(<SanityIcon icon={null} />)).toBe("");
  expect(renderToStaticMarkup(<SanityIcon icon="" />)).toBe("");
  expect(warnSpy).not.toHaveBeenCalled();
});
