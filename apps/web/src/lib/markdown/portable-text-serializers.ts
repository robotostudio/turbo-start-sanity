import { portableTextToMarkdown as ptToMd } from "@portabletext/markdown";

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/**
 * Parse a Sanity asset reference (e.g. "image-abc123-1200x800-jpg")
 * into a CDN URL.
 */
function assetRefToUrl(ref: string): string | null {
  const match = ref.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) return null;
  const [, id, , ext] = match;
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}.${ext}`;
}

/**
 * Resolve the best available image URL from a Sanity image value.
 * Handles both expanded asset objects and projected `id` (asset._ref).
 */
function resolveImageUrl(value: any): string | null {
  if (value?.asset?.url) return value.asset.url;
  if (value?.url) return value.url;
  if (value?.id && typeof value.id === "string") return assetRefToUrl(value.id);
  if (value?.asset?._ref) return assetRefToUrl(value.asset._ref);
  return null;
}

/**
 * Convert a PortableText array to a markdown string.
 * Handles standard blocks plus custom inline block types.
 * @param blocks - PortableText blocks from Sanity
 * @returns Markdown string
 */
export function portableTextToMarkdown(
  blocks: any[] | null | undefined,
): string {
  if (!blocks || blocks.length === 0) return "";

  return ptToMd(blocks, {
    marks: {
      customLink: ({ children, value }: any) => {
        const href = value?.href || "#";
        return `[${children}](${href})`;
      },
      code: ({ children }: any) => `\`${children}\``,
    },
    types: {
      image: ({ value }: any) => {
        const alt = value?.alt || "Image";
        const caption = value?.caption || "";
        const url = resolveImageUrl(value);
        if (!url) return "";
        return caption
          ? `![${alt}](${url})\n\n*${caption}*\n`
          : `![${alt}](${url})\n`;
      },
      table: ({ value }: any) => {
        if (!value?.rows || value.rows.length === 0) return "";
        const rows = value.rows;
        const headers = rows[0]?.cells;
        if (!headers || !Array.isArray(headers)) return "";
        const dataRows = rows.slice(1);
        const esc = (s: string) => s.replace(/\|/g, "\\|");
        let table = `| ${headers.map(esc).join(" | ")} |\n`;
        table += `| ${headers.map(() => "---").join(" | ")} |\n`;
        for (const row of dataRows) {
          if (row?.cells && Array.isArray(row.cells)) {
            table += `| ${row.cells.map(esc).join(" | ")} |\n`;
          }
        }
        return `\n${table}\n`;
      },
      codeBlock: ({ value }: any) => {
        const lang = value?.code?.language || "";
        const code = value?.code?.code || "";
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      },
      buttons: () => "",
    },
  });
}
