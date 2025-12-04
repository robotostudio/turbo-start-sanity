import {createImageUrlBuilder} from "@sanity/image-url";

import styled from "styled-components";

// Image URL builder for generating optimized image URLs
const imageBuilder = createImageUrlBuilder({
  projectId: "bt9po7h0",
  dataset: "production",
});

const urlForImage = (source: any) => {
  if (!source?.asset?._ref) {
    return undefined;
  }
  return imageBuilder?.image(source).auto("format").fit("max");
};

export default function ItemPreview(props: any) {
  const ContainedImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain;
  `;

  return (
    <div style={{flexBasis: "100%"}}>
      {props.renderDefault({
        ...props,
        media: props?.media ? (
          <ContainedImage
            src={urlForImage(props.media)
              ?.width(150)
              .quality(65)
              .auto("format")
              .fit("max")
              .url()}
          />
        ) : null,
      })}
    </div>
  );
}
