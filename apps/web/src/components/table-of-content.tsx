import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { type FC, useMemo } from "react";
import slugify from "slugify";

import { cn } from "@workspace/ui/lib/utils";

import type { PortableTextBlock } from "next-sanity";

export type TableProps = {
  richText?: PortableTextBlock[] | null;
};

const headings = {
  h2: "pl-0",
  h3: "pl-4",
  h4: "pl-8",
  h5: "pl-12",
  h6: "pl-16",
};

const extractTextFromBlock = (block: any[]) => {
  return block?.[0]?.text;
};

const styleToNumber = (style: string) => Number(style.replace("h", ""));

const isExistTableOfContent = (richText?: PortableTextBlock[]) => {
  if (Array.isArray(richText)) {
    const even = (text: any) => text.style in headings;
    return richText.filter(even);
  }
  return [];
};

const getHeadingLevels = (exist: any[]) => {
  const temp: any[] = exist.map((block) => {
    return {
      heading: block?.style,
      href: `#${slugify(extractTextFromBlock(block.children), {
        lower: true,
        strict: true,
      })}`,
      head: styleToNumber(block?.style),
      text: extractTextFromBlock(block.children),
    };
  });

  const headings: any[] = [];
  temp.forEach((block, index) => {
    const children = [];

    if (block.isChild) return;

    let count = index + 1;
    while (count < temp.length && block["head"] < temp[count].head) {
      children.push(temp[count]);
      temp[count]["isChild"] = true;
      count++;
    }

    headings.push({
      ...block,
      children,
    });
  });

  return headings;
};

const AnchorT: FC<{ heading: any }> = ({ heading }) => {
  const { href, text, children, isChild, heading: style } = heading ?? {};
  if (isChild === true && children?.length === 0) return <></>;

  return (
    <li
      className={cn("list-inside list-disc my-2", [
        headings[style as keyof typeof headings],
      ])}
    >
      <Link href={href ?? "#"}>
        <span className="hover:underline">{text}</span>
      </Link>
      {Array.isArray(children) && children.length > 0 && (
        <ul>
          {children.map((child, index) => (
            <AnchorT heading={child} key={`${child.text}-${index}-${style}`} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const TableOfContent: FC<TableProps> = ({ richText }) => {
  const { showTableOfContent, headings } = useMemo(() => {
    const exist = isExistTableOfContent(richText ?? []);
    if (exist.length) {
      const headings = getHeadingLevels(exist);
      return {
        showTableOfContent: true,
        headings,
      };
    }
    return { showTableOfContent: !!exist.length };
  }, [richText]);

  if (!showTableOfContent) return <></>;

  return (
    <div className="sticky left-0 top-8 flex flex-col">
      <details className="group mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-8">
        <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold">
          <span>Table of Contents</span>
          <ChevronDown
            className="h-5 w-5 transform transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav className="mt-4" aria-label="Table of contents">
          <ul className="text-sm">
            {Array.isArray(headings) &&
              headings.map((heading, index) => (
                <AnchorT heading={heading} key={`${heading._key}-${index}`} />
              ))}
          </ul>
        </nav>
      </details>
    </div>
  );
};
