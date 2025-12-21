import type { ReactNode } from "react";
import {
  type ArrayFieldProps,
  type ItemProps,
  type PreviewComponent,
  type PreviewProps,
  useFormValue,
} from "sanity";
import { useImageUrlBuilder } from "sanity-plugin-utils";
import styled from "styled-components";

import type { SanityImageAsset } from "@/sanity.types";

export const ImagesArrayFieldIemPreview = (props: PreviewProps) => {
  const ObjectFitContainImg = styled.img`
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `;

  const builder = useImageUrlBuilder({
    apiVersion: "2024-06-07",
  });

  return props.renderDefault({
    ...props,
    media: props?.media && (
      <ObjectFitContainImg
        src={builder
          ?.image(props.media as unknown as SanityImageAsset)
          .width(400)
          .url()}
        alt={"Image"}
      />
    ),
  });
};

export const ImagesArrayFieldComponent = (props: ArrayFieldProps) => {
  const { id, path } = props as any;

  const columnVariant =
    useFormValue([...path.slice(0, path.length - 1), "columnVariant"]) || {};

  const columnVariantNumberMap: Record<string, number> = {
    single: 1,
    two: 2,
    three: 3,
  };

  const mutatedProps = {
    ...props,
    columnVariant,
  };

  const DynamicColumnVariantWrapper = styled.div`
    display: block;

    & [data-ui="ArrayInput__content"] [data-ui="Card"] [data-ui="Grid"] {
        grid-template-columns: repeat(${columnVariantNumberMap[columnVariant as string] || 1}        , minmax(0, 1fr)) !important;
      ) !important;

      & [data-ui="PreviewCard"] {

        * {
          margin: 0 auto;
          max-height: 200px;
          padding: 0;
          object-fit: contain; 
        }

        > img {
          object-fit: contain;
        }
      }

    }
  `;

  return (
    <DynamicColumnVariantWrapper id={id}>
      {props.renderDefault(mutatedProps)}
    </DynamicColumnVariantWrapper>
  );
};
