import { BlockHeader } from "@workspace/sanity-blocks/internal/block-header";
import type { RichTextValue } from "@workspace/sanity-blocks/internal/rich-text";
import { RichText } from "@workspace/sanity-blocks/internal/rich-text";

import { MuxVideo, type MuxVideoOptions } from "../internal/mux-video";
import { type MuxVideoData, muxPlaybackId } from "../internal/mux";

export interface VideoFeatureVideo extends MuxVideoOptions {
  asset?: MuxVideoData | null;
}

export interface VideoFeatureProps {
  caption?: string | null;
  eyebrow?: string | null;
  richText?: RichTextValue;
  title?: string | null;
  video?: VideoFeatureVideo | null;
}

export function VideoFeature({
  caption,
  eyebrow,
  richText,
  title,
  video,
}: Readonly<VideoFeatureProps>) {
  // No upload, a failed encode and a deleted asset all land here. The copy
  // renders anyway: dropping the section would delete published text, hide the
  // block from Presentation, and disagree with its own Markdown.
  const hasVideo = Boolean(muxPlaybackId(video?.asset));

  return (
    <section className="block-section" id="video-feature">
      <div className="container grid gap-10">
        <BlockHeader eyebrow={eyebrow} title={title}>
          <RichText
            className="body-text max-w-2xl text-muted-foreground"
            richText={richText}
          />
        </BlockHeader>
        {(hasVideo || caption) && (
          <figure className="grid gap-3">
            <MuxVideo options={video} title={title} video={video?.asset} />
            {caption && (
              <figcaption className="text-muted-foreground text-sm">
                {caption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  );
}
