import { GridLayout, MasonryLayout } from "@workspace/layouts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import Image from "next/image";
import React from "react";

const imageDimensions = [
  // 2:3 aspect ratio (portrait)
  {
    width: 2000,
    height: 3000,
  },
  // 3:2 aspect ratio (landscape)
  {
    width: 3000,
    height: 2000,
  },
];

const placeholderUrl = ({ width, height }: { width: number; height: number }) =>
  `https://placehold.co/${width}x${height}`;

const picsumUrl = ({
  width,
  height,
  seed,
}: {
  width: number;
  height: number;
  seed: number;
}) => `https://picsum.photos/seed/${seed}/${width}/${height}`;

const ImageItem = React.memo(
  ({
    isPlaceholder,
    dimensions,
    imageSeed,
  }: {
    isPlaceholder: boolean;
    dimensions: { width: number; height: number };
    imageSeed: number;
  }) => {
    const imageUrl = React.useMemo(() => {
      if (!dimensions) return null;
      return isPlaceholder
        ? placeholderUrl(dimensions)
        : picsumUrl({ ...dimensions, seed: imageSeed });
    }, [dimensions, isPlaceholder, imageSeed]);

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="w-full h-auto">
        {/* biome-ignore lint/performance/noImgElement: sandbox testing */}
        {/* biome-ignore lint/a11y/useAltText: sandbox testing */}
        <Image
          alt={`Image ${imageSeed}`}
          src={imageUrl}
          width={dimensions.width}
          height={dimensions.height}
          sizes="25vw"
        />
      </div>
    );
  }
);

ImageItem.displayName = "ImageItem";

export default function SandboxRoute() {
  const getRandomImageDimensionsFromSeed = React.useCallback((seed: number) => {
    return imageDimensions[seed % imageDimensions.length];
  }, []);

  const gridImages = React.useMemo(() => {
    const seed = 12378373;
    return Array.from({ length: 27 }).map((_, index) => {
      const dimensions = imageDimensions[1];
      return {
        dimensions: dimensions as { width: number; height: number },
        seed: seed + index,
      };
    });
  }, []);

  const masonryImages = React.useMemo(() => {
    const seed = 123612361;
    return Array.from({ length: 14 }).map((_, index) => {
      const dimensions = getRandomImageDimensionsFromSeed(
        (seed + index) % imageDimensions.length
      );
      return {
        dimensions: dimensions as { width: number; height: number },
        seed: seed + index,
      };
    });
  }, [getRandomImageDimensionsFromSeed]);

  return (
    <Tabs defaultValue="grid" className="w-full">
      <main className="my-12 container pb-24">
        <TabsContent value="grid">
          <GridLayout minColumns={3} maxColumns={6}>
            {gridImages.map((item) => (
              <ImageItem
                key={`grid-${item.seed}`}
                isPlaceholder={false}
                dimensions={item.dimensions}
                imageSeed={item.seed}
              />
            ))}
          </GridLayout>
        </TabsContent>
        <TabsContent value="masonry">
          <MasonryLayout
            gap={1}
            imageDimensions={masonryImages.map((item) => item.dimensions)}
          >
            {masonryImages.map((item) => (
              <ImageItem
                key={`masonry-${item.seed}`}
                isPlaceholder={false}
                dimensions={item.dimensions}
                imageSeed={item.seed}
              />
            ))}
          </MasonryLayout>
        </TabsContent>
      </main>
      <div className="sticky bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="grid">Grid Layout</TabsTrigger>
            <TabsTrigger value="masonry">Masonry Layout</TabsTrigger>
          </TabsList>
        </div>
      </div>
    </Tabs>
  );
}
