"use client";

import { stegaClean } from "next-sanity";
import type { PagebuilderType } from "@/types";
import { PageBuilder } from "../pagebuilder";

type GridLayoutProps = PagebuilderType<"gridLayout">;

export function GridLayout({ pageBuilder, columnVariant }: GridLayoutProps) {
  const cleanColumnVariant = stegaClean(columnVariant);
  let columns: number | undefined;
  if (cleanColumnVariant === "auto") {
    columns = pageBuilder?.length || 1;
  } else if (cleanColumnVariant === "single") {
    columns = 1;
  } else if (cleanColumnVariant === "two") {
    columns = 2;
  } else if (cleanColumnVariant === "three") {
    columns = 3;
  } else {
    columns = 1;
  }
  if (!pageBuilder || pageBuilder.length === 0 || !columns) {
    return null;
  }

  const validPageBuilder = pageBuilder.filter(
    (block): block is NonNullable<typeof block> => block != null
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className="grid grid-cols-1 gap-8 md:grid"
        style={{
          gridTemplateColumns:
            columns > 1
              ? `repeat(${columns}, minmax(0, 1fr))`
              : "minmax(0, 1fr)",
        }}
      >
        {validPageBuilder.map((block, index) => (
          <div className="min-w-0" key={block._key || index}>
            <PageBuilder
              id={block._key || `grid-${index}`}
              pageBuilder={[block as unknown as any]}
              type="gridLayout"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
