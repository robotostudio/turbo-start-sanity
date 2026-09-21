import type { SanityDocument } from "sanity";
import { at, defineMigration, set } from "sanity/migrate";

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

// `mediaType` became required in #439 with no backfill, so heroes authored
// before it cannot be published. Set what `mediaTypeOf` already infers.
export default defineMigration({
  title: "Backfill hero mediaType",
  documentTypes: ["page", "homePage", "blogIndex"],
  migrate: {
    document(doc: SanityDocument) {
      const blocks = (doc as { pageBuilder?: Block[] }).pageBuilder;
      const patches = [];
      for (const block of blocks ?? []) {
        if (block._type !== "hero") continue;
        for (const variant of VARIANTS) {
          const value = block.video?.[variant];
          if (!value || value.mediaType) continue;
          patches.push(
            at(
              [
                "pageBuilder",
                { _key: block._key },
                "video",
                variant,
                "mediaType",
              ],
              set(value.mux?.asset?._ref ? "mux" : "sanity")
            )
          );
        }
      }
      return patches;
    },
  },
});
