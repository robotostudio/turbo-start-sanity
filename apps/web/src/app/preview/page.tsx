import { PageBuilder } from "@/components/pagebuilder";
import { client } from "@/lib/sanity/client";

export const dynamic = "force-dynamic";

/**
 * Render a preview of a specific PageBuilder block from a Sanity document.
 *
 * @param searchParams - Promise resolving to an object with `docId` (the document ID) and `blockKey` (the block's `_key`) used to locate the block to preview
 * @returns A React element containing the block preview, or `null` if the block is not found
 */
export default async function BlockPreview({
  searchParams,
}: {
  searchParams: Promise<{ docId: string; blockKey: string }>;
}) {
  const { docId, blockKey } = await searchParams;

  const query = `
    *[_id == $docId || _id == "drafts." + $docId][0]{
      pageBuilder[]{
        ...,
        _key
      }
    }
  `;

  const data = await client.fetch(query, { docId });
  const block = data?.pageBuilder?.find((b: any) => b._key === blockKey);

  if (!block) return null;

  return (
    <div
      style={{
        width: 1200,
        padding: 48,
        background: "#fff",
      }}
    >
      {PageBuilder({ ...block, preview: true })}
    </div>
  );
}