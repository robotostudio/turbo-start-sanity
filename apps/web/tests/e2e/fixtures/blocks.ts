import { runId } from "../presentation-fixtures";

/**
 * One entry per member of `blockSchemas`. Hand-kept rather than imported:
 * the schema module pulls in `sanity` and `lucide-react`. The spec checks this
 * list against `apps/studio/schema.json`, so a block without a fixture fails.
 */

/** Dataset assets a block may reference; `null` when the dataset has none. */
export type BlockAssets = {
  imageId: string | null;
  muxAssetId: string | null;
};

export type BlockFixture = {
  /** The `_type`, and the name the test carries. */
  type: string;
  /** What the insert menu shows: the schema `title`, else Sanity's start-cased name. */
  title: string;
  /** Unique text the block must render in the iframe and emit in `.md`. */
  heading: string;
  /** The fields a Studio-inserted block gets patched with. */
  block: (assets: BlockAssets) => Record<string, unknown>;
  /** Set when the block carries no copy of its own — its heading is an image's alt text. */
  requiresImage?: boolean;
  /** Set when the schema marks a Mux video required, so the fixture is unpublishable without one. */
  requiresMux?: boolean;
};

const heading = (type: string) => `E2E ${type} ${runId}`;

const image = (id: string, alt: string) => ({
  _type: "image",
  alt,
  asset: { _type: "reference", _ref: id },
});

export const blockFixtures: BlockFixture[] = [
  {
    type: "hero",
    title: "Hero",
    heading: heading("hero"),
    block: () => ({ title: heading("hero") }),
  },
  {
    type: "cta",
    title: "Cta",
    heading: heading("cta"),
    block: () => ({ title: heading("cta") }),
  },
  {
    type: "featureCardsIcon",
    title: "Feature Cards Icon",
    heading: heading("featureCardsIcon"),
    block: () => ({
      title: heading("featureCardsIcon"),
      cards: [{ _key: "card", _type: "featureCardIcon", title: "Card" }],
    }),
  },
  {
    // Questions are `faq` references, so the block ships without any: the
    // header (its title) is what both render paths carry.
    type: "faqAccordion",
    title: "Faq Accordion",
    heading: heading("faqAccordion"),
    block: () => ({ title: heading("faqAccordion") }),
  },
  {
    // No copy at all: the logo's alt text is the only string it renders, and
    // Markdown drops a logo with no resolvable image.
    type: "logoCloud",
    title: "Logo Cloud",
    heading: heading("logoCloud"),
    requiresImage: true,
    block: ({ imageId }) => ({
      logos: imageId
        ? [
            {
              _key: "logo",
              _type: "logoCloudItem",
              image: image(imageId, heading("logoCloud")),
            },
          ]
        : [],
    }),
  },
  {
    type: "socialGrid",
    title: "Social Grid",
    heading: heading("socialGrid"),
    block: () => ({
      title: heading("socialGrid"),
      socials: [
        {
          _key: "social",
          _type: "socialGridItem",
          platform: "github",
          label: "GitHub",
        },
      ],
    }),
  },
  {
    type: "showcaseGrid",
    title: "Showcase Grid",
    heading: heading("showcaseGrid"),
    block: () => ({
      title: heading("showcaseGrid"),
      items: [{ _key: "site", _type: "showcaseItem", siteName: "Site" }],
    }),
  },
  {
    type: "richTextBlock",
    title: "Rich Text Block",
    heading: heading("richTextBlock"),
    block: () => ({ title: heading("richTextBlock") }),
  },
  {
    type: "subscribeNewsletter",
    title: "Subscribe Newsletter",
    heading: heading("subscribeNewsletter"),
    block: () => ({ title: heading("subscribeNewsletter") }),
  },
  {
    // Points at a clip already in the dataset; nothing is uploaded, and the
    // spec never presses play, so Mux bills nothing.
    type: "videoFeature",
    title: "Video",
    requiresMux: true,
    heading: heading("videoFeature"),
    block: ({ muxAssetId }) => ({
      title: heading("videoFeature"),
      ...(muxAssetId && {
        video: {
          asset: {
            _type: "mux.video",
            asset: { _type: "reference", _ref: muxAssetId, _weak: true },
          },
        },
      }),
    }),
  },
];
