import { PageBuilder } from "@/components/pagebuilder";
import { client } from "@/lib/sanity/client";

export const dynamic = "force-dynamic";

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
