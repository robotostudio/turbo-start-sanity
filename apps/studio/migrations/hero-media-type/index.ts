import type { SanityDocument } from "sanity";
import {
  at,
  defineMigration,
  type MigrationContext,
  setIfMissing,
} from "sanity/migrate";

const VARIANTS = ["light", "dark"] as const;

interface HeroVariant {
  mediaType?: string;
  mux?: { asset?: { _ref?: string } };
}

interface Block {
  _key: string;
  _type: string;
  video?: Partial<Record<(typeof VARIANTS)[number], HeroVariant>>;
}

interface MuxAsset {
  _id: string;
  playbackId?: string;
  policy?: string;
  status?: string;
}

// Same test as `muxPlaybackId`, so the backfill matches what the site renders.
function isPlayable(asset: MuxAsset) {
  return (
    Boolean(asset.playbackId) &&
    asset.status !== "errored" &&
    asset.policy === "public"
  );
}

async function playableAssetIds(refs: string[], context: MigrationContext) {
  if (refs.length === 0) return new Set<string>();
  const assets = await context.client.fetch<MuxAsset[]>(
    `*[_id in $ids]{ _id, playbackId, status, "policy": data.playback_ids[0].policy }`,
    { ids: refs }
  );
  return new Set(assets.filter(isPlayable).map((asset) => asset._id));
}

// `mediaType` became required in #439 with no backfill, so heroes authored
// before it cannot be published. Set what `mediaTypeOf` already infers.
export default defineMigration({
  title: "Backfill hero mediaType",
  documentTypes: ["page", "homePage", "blogIndex"],
  migrate: {
    async document(doc: SanityDocument, context: MigrationContext) {
      const blocks = (doc as { pageBuilder?: Block[] }).pageBuilder ?? [];
      const missing = blocks
        .filter((block) => block._type === "hero")
        .flatMap((block) =>
          VARIANTS.map((variant) => ({
            block,
            variant,
            value: block.video?.[variant],
          }))
        )
        .filter(({ value }) => value && !value.mediaType);

      const refs = missing
        .map(({ value }) => value?.mux?.asset?._ref)
        .filter((ref): ref is string => Boolean(ref));
      const playable = await playableAssetIds(refs, context);

      return missing.map(({ block, variant, value }) => {
        const ref = value?.mux?.asset?._ref;
        return at(
          ["pageBuilder", { _key: block._key }, "video", variant, "mediaType"],
          setIfMissing(ref && playable.has(ref) ? "mux" : "sanity")
        );
      });
    },
  },
});
