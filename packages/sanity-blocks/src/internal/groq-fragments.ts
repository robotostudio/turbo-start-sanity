export const imageFields = /* groq */ `
  "id": asset._ref,
  "preview": asset->metadata.lqip,
  "alt": coalesce(
    alt,
    asset->altText,
    caption,
    asset->originalFilename,
    "untitled"
  ),
  hotspot {
    x,
    y
  },
  crop {
    bottom,
    left,
    right,
    top
  }
`;

export const imageFragment = /* groq */ `
  image {
    ${imageFields}
  }
`;

const customLinkFragment = /* groq */ `
  ...customLink{
    openInNewTab,
    "href": select(
      type == "internal" => internal->slug.current,
      type == "external" => external,
      "#"
    ),
  }
`;

export const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
    ${customLinkFragment}
  }
`;

export const richTextFragment = /* groq */ `
  richText[]{
    ...,
    _type == "block" => {
      ...,
      ${markDefsFragment}
    },
    _type == "image" => {
      ${imageFields},
      "caption": caption
    }
  }
`;

export const buttonsFragment = /* groq */ `
  buttons[]{
    text,
    variant,
    _key,
    _type,
    "openInNewTab": url.openInNewTab,
    "href": select(
      url.type == "internal" => url.internal->slug.current,
      url.type == "external" => url.external,
      url.href
    ),
  }
`;

export const urlFragment = /* groq */ `
  "openInNewTab": url.openInNewTab,
  "href": select(
    url.type == "internal" => url.internal->slug.current,
    url.type == "external" => url.external,
    url.href
  )
`;

/** `mux.video` holds only a reference; everything playable is on the asset. */
export const muxVideoFields = /* groq */ `
  "playbackId": asset->playbackId,
  "policy": asset->data.playback_ids[0].policy,
  "aspectRatio": asset->data.aspect_ratio,
  "status": asset->status,
  "thumbTime": asset->thumbTime,
  "title": asset->filename
`;

/** The `muxVideoEmbedField` shape: the clip, plus how the editor wants it played. */
export const muxVideoEmbedFields = /* groq */ `
  asset {
    ${muxVideoFields}
  },
  autoPlay,
  loop
`;
