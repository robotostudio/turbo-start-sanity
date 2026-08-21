import {
  buttonsField,
  definePortableTextField,
  muxVideoField,
} from "@workspace/sanity-blocks/internal/schema-fields";
import { Star } from "lucide-react";
import { defineField, defineType } from "sanity";

/** The three delivery paths a hero background can take. */
export const HERO_MEDIA_TYPES = ["mux", "mux-mp4", "sanity"] as const;

type HeroVariantValue = {
  mediaType?: string;
  mux?: { asset?: unknown } | null;
  webm?: unknown;
  hevc?: unknown;
  mobileWebm?: unknown;
};

/** Whether a variant carries any hand-encoded file, in any of the three slots. */
const hasFiles = (variant?: HeroVariantValue) =>
  Boolean(variant?.webm || variant?.hevc || variant?.mobileWebm);

/**
 * Absent on everything authored before this field existed, so the renderer
 * infers rather than defaults — see `mediaTypeOf` in `hero-video`. Kept in one
 * place so schema, validation and render agree on what a blank value means.
 */
const selected = (variant?: HeroVariantValue) => {
  const type = variant?.mediaType;
  return type === "sanity" || type === "mux-mp4" ? type : "mux";
};

/** Hides a field unless one of the listed paths is the one selected. */
const showFor =
  (...types: readonly string[]) =>
  (context: { parent?: unknown }) =>
    !types.includes(selected(context.parent as HeroVariantValue));

/**
 * One theme's worth of background, delivered one of two ways.
 *
 * Mux takes a single upload and encodes it for every device. The Sanity path
 * is the hand-encoded set it replaced — an AV1 `.webm` for most browsers, an
 * HEVC `.mp4` for Safari, and a smaller `.webm` for phones. Both are kept so
 * the two can be measured against each other on the same page.
 *
 * The picture covers the load, stands alone when there is no video, and falls
 * back to the clip's own opening frame when skipped.
 */
const videoVariantFields = () => [
  defineField({
    name: "mediaType",
    type: "string",
    title: "Video Source",
    description:
      "Where this background is served from. Mux encodes one upload for every device. Sanity serves the files you upload below, exactly as encoded.",
    initialValue: "mux",
    options: {
      layout: "radio",
      list: [
        {
          title: "Mux — one upload, adapts to the connection",
          value: "mux",
        },
        {
          title: "Mux as a single file — lighter, does not adapt",
          value: "mux-mp4",
        },
        { title: "Sanity — your own encoded files", value: "sanity" },
      ],
    },
    validation: (Rule) => Rule.required(),
  }),
  muxVideoField({
    name: "mux",
    title: "Video",
    hidden: showFor("mux", "mux-mp4"),
  }),
  defineField({
    name: "webm",
    type: "file",
    title: "Video For Computers",
    description:
      "The .webm file, encoded as AV1. Most people see this one. The AV1 codec is declared to the browser so Safari skips it and takes the .mp4 instead — upload a VP9 .webm here and this hero may fall back to the .mp4 or just the poster image.",
    options: { accept: "video/webm" },
    hidden: showFor("sanity"),
  }),
  defineField({
    name: "hevc",
    type: "file",
    title: "Video For Apple Devices",
    description: "The .mp4 file. Macs, iPhones and iPads need this one.",
    options: { accept: "video/mp4" },
    hidden: showFor("sanity"),
  }),
  defineField({
    name: "mobileWebm",
    type: "file",
    title: "Video For Phones",
    description:
      "A smaller .webm, so phones do not have to download the big file. AV1, like the one above.",
    options: { accept: "video/webm" },
    hidden: showFor("sanity"),
  }),
  defineField({
    name: "poster",
    type: "image",
    title: "Picture",
    description:
      "Optional. Shown while the video loads, or on its own if you add no video.",
  }),
];

/**
 * Flags the one mistake the toggle makes possible: content uploaded to the
 * path that is not selected. Silent otherwise — a picture with no video at all
 * is a valid background.
 */
const checkVariant = (value: unknown): true | string => {
  const variant = value as HeroVariantValue | undefined;
  if (!variant) {
    return true;
  }
  const type = selected(variant);
  if (type !== "sanity" && !variant.mux?.asset && hasFiles(variant)) {
    return "Set to Mux, but only uploaded files are here. Upload a Mux video, or switch the source to Sanity.";
  }
  if (type === "sanity" && !hasFiles(variant) && variant.mux?.asset) {
    return "Set to Sanity, but only a Mux video is here. Upload the files, or switch the source to Mux.";
  }
  return true;
};

export const heroVideoField = defineField({
  name: "video",
  type: "object",
  title: "Background",
  description: "Add a video. If you have no video, add a picture instead.",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "light",
      type: "object",
      title: "Light Mode",
      description: "Shown in light mode.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
      validation: (Rule) => Rule.custom(checkVariant).warning(),
    }),
    defineField({
      name: "dark",
      type: "object",
      title: "Dark Mode",
      description: "Optional. Leave empty to reuse the light mode background.",
      options: { collapsible: true, collapsed: false },
      fields: videoVariantFields(),
      validation: (Rule) => Rule.custom(checkVariant).warning(),
    }),
  ],
});

export const heroSchema = defineType({
  name: "hero",
  type: "object",
  title: "Hero",
  icon: Star,
  fields: [
    defineField({
      name: "badge",
      type: "string",
      title: "Badge",
      description:
        "Optional badge text displayed above the title, useful for highlighting new features or promotions",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      description:
        "The main heading text for the hero section that captures attention",
    }),
    definePortableTextField(["block"], {
      name: "richText",
      description:
        "The supporting paragraph shown beneath the title, introducing the page in a sentence or two",
    }),
    heroVideoField,
    buttonsField,
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title,
      subtitle: "Hero Block",
    }),
  },
});
