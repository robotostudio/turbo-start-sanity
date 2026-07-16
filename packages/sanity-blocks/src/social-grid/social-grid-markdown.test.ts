import { socialGridToMarkdown } from "./markdown";

test("socialGridToMarkdown returns empty string for a fully empty block", () => {
  expect(socialGridToMarkdown({}, {})).toBe("");
});

test("socialGridToMarkdown renders the eyebrow, title and subtitle", () => {
  const result = socialGridToMarkdown(
    {
      eyebrow: "Socials",
      title: "Join our community",
      subtitle: "Stay updated with the latest.",
    },
    {}
  );
  expect(result).toContain("**Socials**");
  expect(result).toContain("## Join our community");
  expect(result).toContain("Stay updated with the latest.");
});

test("socialGridToMarkdown renders socials as a linked list", () => {
  const result = socialGridToMarkdown(
    {
      socials: [
        {
          _key: "s1",
          platform: "reddit",
          label: "Reddit",
          href: "https://reddit.com/r/example",
        },
        { _key: "s2", platform: "github", label: "GitHub", href: "#" },
      ],
    },
    {}
  );
  expect(result).toContain("- [Reddit](https://reddit.com/r/example)");
  // A "#" href degrades to plain text, not a link.
  expect(result).toContain("- GitHub");
  expect(result).not.toContain("](#)");
});

test("socialGridToMarkdown falls back to the platform when no label is set", () => {
  const result = socialGridToMarkdown(
    { socials: [{ _key: "s1", platform: "youtube", href: "https://yt.com" }] },
    {}
  );
  expect(result).toContain("- [youtube](https://yt.com)");
});

test("socialGridToMarkdown emits no HTML or JSX tags", () => {
  const result = socialGridToMarkdown(
    {
      eyebrow: "Socials",
      title: "Join our community",
      subtitle: "Stay updated.",
      socials: [
        {
          _key: "s1",
          platform: "reddit",
          label: "Reddit",
          href: "https://reddit.com",
        },
      ],
    },
    {}
  );
  expect(result).not.toMatch(/<[A-Za-z]/);
});
