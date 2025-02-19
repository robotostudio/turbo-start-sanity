import { faker } from "@faker-js/faker";
import { htmlToBlocks } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";
import type { FieldDefinition } from "sanity";

import schemaTypes from "../schemaTypes";

const defaultSchema = Schema.compile({ types: schemaTypes });
const blockContentSchema = defaultSchema
  .get("blog")
  .fields.find((field: FieldDefinition) => field.name === "richText").type;

interface HTMLGeneratorOptions {
  enableLists?: boolean;
  headingLevels?: Array<"h2" | "h3">;
  marks?: Array<"strong" | "em">;
}

function generateHTML(count: number, options: HTMLGeneratorOptions = {}) {
  const {
    enableLists = false,
    headingLevels = [],
    marks = ["strong", "em"],
  } = options;

  const formatWord = (word: string): string => {
    const randomValue = faker.number.int({ min: 1, max: 10 });
    if (randomValue > 8 && marks.length > 0) {
      const markCombinations = [
        ...marks.map((mark) => `<${mark}>${word}</${mark}>`),
        ...(marks.includes("strong") && marks.includes("em")
          ? [`<strong><em>${word}</em></strong>`]
          : []),
      ];
      return faker.helpers.arrayElement(markCombinations);
    }
    return word;
  };

  const generateParagraph = () => {
    if (headingLevels.length > 0 && faker.number.int({ min: 1, max: 10 }) > 8) {
      const level = faker.helpers.arrayElement(headingLevels);
      return `<${level}>${faker.lorem.sentence()}</${level}>`;
    }

    if (enableLists && faker.number.int({ min: 1, max: 10 }) > 8) {
      const items = faker.helpers.multiple(() => faker.lorem.sentence(), {
        count: faker.number.int({ min: 2, max: 5 }),
      });
      return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    }

    const paragraph = faker.lorem.paragraph();
    const formattedWords = paragraph.split(" ").map(formatWord);
    return `<p>${formattedWords.join(" ")}</p>`;
  };

  return faker.helpers.multiple(generateParagraph, { count }).join("");
}

// Create 2-5 paragraphs of fake block content
export function createFakeBlockContent(
  options: {
    minParagraphs?: number;
    maxParagraphs?: number;
    rich?: boolean;
  } = {},
) {
  const { minParagraphs = 2, maxParagraphs = 5, rich = false } = options ?? {};
  const count = faker.number.int({
    min: minParagraphs,
    max: maxParagraphs,
  });
  const html = generateHTML(count, {
    enableLists: rich,
    headingLevels: rich ? ["h2", "h3"] : [],
  });
  return htmlToBlocks(html, blockContentSchema, {
    parseHtml: (html) => new JSDOM(html).window.document,
  });
}

export function parseHTML(html: string) {
  return htmlToBlocks(html, blockContentSchema, {
    parseHtml: (html) => new JSDOM(html).window.document,
  });
}
