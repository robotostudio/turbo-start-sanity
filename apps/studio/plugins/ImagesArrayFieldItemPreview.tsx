import {Flex} from "@sanity/ui";
import {createContext, useContext} from "react";
import {type ArrayFieldProps, type ItemProps, useFormValue} from "sanity";
import styled from "styled-components";

export const ImagesArrayFieldIemPreview = (props: ItemProps) => {
  const {columnVariant} = useImagesArrayFieldContext();

  const TwoColItemPreview = styled.div`
    width: 50%;
    padding: 8px;
    background: red;
  `;

  return <TwoColItemPreview>{props.renderDefault(props)}</TwoColItemPreview>;
};

const ImagesArrayFieldContext = createContext<any>({columnVariant: {}});

const useImagesArrayFieldContext = () => useContext(ImagesArrayFieldContext);

const ImagesArrayFieldContextProvider = ImagesArrayFieldContext.Provider;

export const ImagesArrayFieldComponent = (props: ArrayFieldProps) => {
  const {id, path} = props as any;

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
    width: 100%;

    & [data-ui="ArrayInput__content"] [data-ui="Card"] [data-ui="Grid"] {
        grid-template-columns: repeat(${columnVariantNumberMap[columnVariant as string] || 1}, minmax(0, 1fr)) !important;
      ) !important;
    }
  `;

  return (
    <ImagesArrayFieldContextProvider value={{columnVariant}}>
      <DynamicColumnVariantWrapper id={id}>
        {props.renderDefault(mutatedProps)}
      </DynamicColumnVariantWrapper>
    </ImagesArrayFieldContextProvider>
  );
};
