import { faqAccordionToJsonLd } from "./json-ld";

type JsonLdQuestion = {
  "@type": string;
  name: unknown;
  acceptedAnswer: unknown;
};
type JsonLdAnswer = { "@type": string; text: unknown };

const block = (
  _type: string,
  children: Array<{ _type: string; text?: string }>
) => ({ _type, children });

const span = (text: string) => ({ _type: "span", text });

function questions(
  result: ReturnType<typeof faqAccordionToJsonLd>
): JsonLdQuestion[] {
  return result?.mainEntity as unknown as JsonLdQuestion[];
}

test("returns null for empty or missing faqs", () => {
  expect(faqAccordionToJsonLd({ faqs: [] })).toBeNull();
  expect(faqAccordionToJsonLd({})).toBeNull();
  expect(faqAccordionToJsonLd({ faqs: null })).toBeNull();
});

test("returns null when no faq has both title and richText", () => {
  expect(
    faqAccordionToJsonLd({
      faqs: [
        { title: "Q?", richText: null },
        { richText: [block("block", [span("no title")])] },
      ],
    })
  ).toBeNull();
});

test("builds FAQPage with mainEntity for a valid faq", () => {
  const result = faqAccordionToJsonLd({
    faqs: [
      {
        title: "What is JSON-LD?",
        richText: [block("block", [span("A serialization format.")])],
      },
    ],
  });

  expect(result).not.toBeNull();
  expect(result?.["@type"]).toBe("FAQPage");
  const entities = questions(result);
  expect(entities).toHaveLength(1);
  expect(entities[0]?.["@type"]).toBe("Question");
  expect(entities[0]?.name).toBe("What is JSON-LD?");
  const answer = entities[0]?.acceptedAnswer as JsonLdAnswer;
  expect(answer["@type"]).toBe("Answer");
  expect(answer.text).toBe("A serialization format.");
});

test("filters out faqs missing title or richText, keeps valid ones", () => {
  const result = faqAccordionToJsonLd({
    faqs: [
      {
        title: "Valid?",
        richText: [block("block", [span("Yes.")])],
      },
      { title: null, richText: [block("block", [span("no title")])] },
      { title: "No body?", richText: null },
    ],
  });

  expect(result).not.toBeNull();
  const entities = questions(result);
  expect(entities).toHaveLength(1);
  expect(entities[0]?.name).toBe("Valid?");
});

test("joins multiple spans across multiple blocks", () => {
  const result = faqAccordionToJsonLd({
    faqs: [
      {
        title: "Multi-block?",
        richText: [
          block("block", [span("First. "), span("Second.")]),
          block("block", [span("Third.")]),
        ],
      },
    ],
  });

  const entities = questions(result);
  const answer = entities[0]?.acceptedAnswer as JsonLdAnswer;
  expect(answer.text).toBe("First. Second. Third.");
});

test("ignores non-block rich text nodes", () => {
  const result = faqAccordionToJsonLd({
    faqs: [
      {
        title: "Image block?",
        richText: [
          { _type: "image", children: [span("should be ignored")] },
          block("block", [span("Only text.")]),
        ],
      },
    ],
  });

  const entities = questions(result);
  const answer = entities[0]?.acceptedAnswer as JsonLdAnswer;
  expect(answer.text).toBe("Only text.");
});
