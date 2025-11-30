"use client";

import MuxPlayer from "@mux/mux-player-react";
import { stegaClean } from "next-sanity";

import type { PagebuilderType } from "@/types";

type VideoSectionProps = PagebuilderType<"videoSection">;

export function VideoSection({
  video,
  styleVariant,
  title,
  description,
}: VideoSectionProps) {
  if (!video?.asset?.playbackId) {
    return null;
  }

  const cleanStyleVariant = stegaClean(styleVariant);
  const isFullBleed = cleanStyleVariant === "fullBleed";

  return (
    <section
      className={
        isFullBleed
          ? "-mx-4 md:-mx-8 relative w-[calc(100%+2rem)] md:w-[calc(100%+4rem)]"
          : "container mx-auto px-4"
      }
    >
      <div className="w-full">
        {title && (
          <h2 className="mb-4 font-semibold text-2xl md:text-3xl">{title}</h2>
        )}
        <div className="aspect-video w-full">
          <MuxPlayer
            playbackId={video.asset.playbackId}
            streamType="on-demand"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        {description && (
          <p className="mt-4 text-base text-muted-foreground">{description}</p>
        )}
      </div>
    </section>
  );
}
