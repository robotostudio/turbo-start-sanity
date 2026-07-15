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

type FaqLike = {
  title?: string | null;
  richText?: ReturnType<typeof block>[] | null;
};

const category = (faqs: FaqLike[]) => [
  { _key: "cat-1", title: "General", faqs },
];

function questions(
  result: ReturnType<typeof faqAccordionToJsonLd>
): JsonLdQuestion[] {
  return result?.mainEntity as unknown as JsonLdQuestion[];
}

test("returns null for empty or missing faqs", () => {
  expect(faqAccordionToJsonLd({ categories: [] })).toBeNull();
  expect(faqAccordionToJsonLd({})).toBeNull();
  expect(faqAccordionToJsonLd({ categories: null })).toBeNull();
  expect(faqAccordionToJsonLd({ categories: category([]) })).toBeNull();
});

test("returns null when no faq has both title and richText", () => {
  expect(
    faqAccordionToJsonLd({
      categories: category([
        { title: "Q?", richText: null },
        { richText: [block("block", [span("no title")])] },
      ]),
    })
  ).toBeNull();
});

test("builds FAQPage with mainEntity for a valid faq", () => {
  const result = faqAccordionToJsonLd({
    categories: category([
      {
        title: "What is JSON-LD?",
        richText: [block("block", [span("A serialization format.")])],
      },
    ]),
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
    categories: category([
      {
        title: "Valid?",
        richText: [block("block", [span("Yes.")])],
      },
      { title: null, richText: [block("block", [span("no title")])] },
      { title: "No body?", richText: null },
    ]),
  });

  expect(result).not.toBeNull();
  const entities = questions(result);
  expect(entities).toHaveLength(1);
  expect(entities[0]?.name).toBe("Valid?");
});

test("aggregates valid faqs across multiple categories", () => {
  const result = faqAccordionToJsonLd({
    categories: [
      { faqs: [{ title: "Q1", richText: [block("block", [span("A1")])] }] },
      { faqs: [{ title: "Q2", richText: [block("block", [span("A2")])] }] },
    ],
  });

  const entities = questions(result);
  expect(entities).toHaveLength(2);
  expect(entities[0]?.name).toBe("Q1");
  expect(entities[1]?.name).toBe("Q2");
});

test("joins multiple spans across multiple blocks", () => {
  const result = faqAccordionToJsonLd({
    categories: category([
      {
        title: "Multi-block?",
        richText: [
          block("block", [span("First. "), span("Second.")]),
          block("block", [span("Third.")]),
        ],
      },
    ]),
  });

  const entities = questions(result);
  const answer = entities[0]?.acceptedAnswer as JsonLdAnswer;
  expect(answer.text).toBe("First. Second. Third.");
});

test("ignores non-block rich text nodes", () => {
  const result = faqAccordionToJsonLd({
    categories: category([
      {
        title: "Image block?",
        richText: [
          { _type: "image", children: [span("should be ignored")] },
          block("block", [span("Only text.")]),
        ],
      },
    ]),
  });

  const entities = questions(result);
  const answer = entities[0]?.acceptedAnswer as JsonLdAnswer;
  expect(answer.text).toBe("Only text.");
});
