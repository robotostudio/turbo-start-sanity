import { subscribeNewsletterToMarkdown } from "./markdown";

const para = (text: string) => [
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text }],
  },
];

test("subscribeNewsletterToMarkdown returns empty string for a fully empty block", () => {
  expect(subscribeNewsletterToMarkdown({}, {})).toBe("");
});

test("subscribeNewsletterToMarkdown renders title only", () => {
  expect(subscribeNewsletterToMarkdown({ title: "Subscribe" }, {})).toBe(
    "## Subscribe"
  );
});

test("subscribeNewsletterToMarkdown renders title, subTitle, and helperText", () => {
  const result = subscribeNewsletterToMarkdown(
    {
      title: "Stay in the loop",
      subTitle: para("Get weekly updates."),
      helperText: para("No spam, ever."),
    },
    {}
  );
  expect(result).toBe(
    "## Stay in the loop\n\nGet weekly updates.\n\nNo spam, ever."
  );
});

test("subscribeNewsletterToMarkdown escapes markdown chars in title", () => {
  const result = subscribeNewsletterToMarkdown(
    { title: "Subscribe to #updates" },
    {}
  );
  expect(result).toBe("## Subscribe to \\#updates");
});

test("subscribeNewsletterToMarkdown handles undefined subTitle and helperText", () => {
  expect(() =>
    subscribeNewsletterToMarkdown(
      { title: "Sub", subTitle: undefined, helperText: undefined },
      {}
    )
  ).not.toThrow();
});

test("subscribeNewsletterToMarkdown emits no form or input markup", () => {
  const result = subscribeNewsletterToMarkdown(
    { title: "Subscribe", subTitle: para("Enter your email.") },
    {}
  );
  expect(result).not.toMatch(/<(form|input|button)/i);
});
