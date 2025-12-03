import {
  SanityImage as BaseSanityImage,
  type WrapperProps,
} from "sanity-image";
import {
  processImageData,
  SANITY_BASE_URL,
  type SanityImageProps,
} from "@/lib/sanity/image";

// Image wrapper component
const ImageWrapper = <T extends React.ElementType = "img">(
  props: WrapperProps<T>
) => <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;

// Main component
export function SanityImage({ image, ...props }: SanityImageProps) {
  const processedImageData = processImageData(image);

  // Early return for invalid image data
  if (!processedImageData) {
    return null;
  }

  return <ImageWrapper {...props} {...processedImageData} />;
}
