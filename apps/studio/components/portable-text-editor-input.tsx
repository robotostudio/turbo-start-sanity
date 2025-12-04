import {bold, italic, code} from "@portabletext/keyboard-shortcuts";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  type PortableTextBlock,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
} from "@portabletext/editor";
import {EventListenerPlugin} from "@portabletext/editor/plugins";
import {
  useDecoratorButton,
  useStyleSelector,
  useToolbarSchema,
  type ExtendDecoratorSchemaType,
  type ExtendStyleSchemaType,
  type ToolbarDecoratorSchemaType,
  type ToolbarStyleSchemaType,
} from "@portabletext/toolbar";
import {Box, Button, Flex, Stack} from "@sanity/ui";
import {useCallback, useEffect, useMemo, useState} from "react";
import {
  type ArrayOfObjectsInputProps,
  set,
  unset,
} from "sanity";
import {styled} from "styled-components";

// Styled components
const EditorContainer = styled(Box)`
  border: 1px solid var(--card-border-color);
  border-radius: 4px;
  padding: 12px;
  min-height: 200px;
  background: var(--card-bg-color);
`;

const ToolbarContainer = styled(Flex)`
  border-bottom: 1px solid var(--card-border-color);
  padding: 8px;
  gap: 4px;
  flex-wrap: wrap;
`;

const ToolbarButton = styled(Button)`
  cursor: pointer;
  
  &[data-active="true"] {
    background: var(--card-accent-fg-color);
    color: var(--card-bg-color);
  }
`;

// Define the schema based on your rich-text configuration
const schemaDefinition = defineSchema({
  styles: [
    {name: "normal", title: "Normal"},
    {name: "h2", title: "H2"},
    {name: "h3", title: "H3"},
    {name: "h4", title: "H4"},
    {name: "h5", title: "H5"},
    {name: "h6", title: "H6"},
  ],
  decorators: [
    {name: "strong", title: "Strong"},
    {name: "em", title: "Emphasis"},
    {name: "code", title: "Code"},
  ],
  lists: [
    {name: "number", title: "Numbered"},
    {name: "bullet", title: "Bullet"},
  ],
  annotations: [],
  blockObjects: [],
  inlineObjects: [],
});

// Render functions
const renderStyle: RenderStyleFunction = (props) => {
  // Access the style name/value from schemaType
  const styleName = (props.schemaType as {name?: string; value?: string}).name || 
                    (props.schemaType as {name?: string; value?: string}).value;
  
  if (styleName === "h2") {
    return <h2>{props.children}</h2>;
  }
  if (styleName === "h3") {
    return <h3>{props.children}</h3>;
  }
  if (styleName === "h4") {
    return <h4>{props.children}</h4>;
  }
  if (styleName === "h5") {
    return <h5>{props.children}</h5>;
  }
  if (styleName === "h6") {
    return <h6>{props.children}</h6>;
  }
  return <div>{props.children}</div>;
};

const renderDecorator: RenderDecoratorFunction = (props) => {
  // Decorator props have a 'value' property that contains the decorator name
  if (props.value === "strong") {
    return <strong>{props.children}</strong>;
  }
  if (props.value === "em") {
    return <em>{props.children}</em>;
  }
  if (props.value === "code") {
    return <code>{props.children}</code>;
  }
  return <>{props.children}</>;
};

// Extend schema for toolbar
const extendStyle: ExtendStyleSchemaType = (style) => {
  const styleLabels: Record<string, string> = {
    normal: "Normal",
    h2: "H2",
    h3: "H3",
    h4: "H4",
    h5: "H5",
    h6: "H6",
  };
  
  return {
    ...style,
    title: styleLabels[style.name] || style.title,
  };
};

const extendDecorator: ExtendDecoratorSchemaType = (decorator) => {
  const decoratorConfig: Record<string, {icon: string; shortcut: typeof bold}> = {
    strong: {icon: "B", shortcut: bold},
    em: {icon: "I", shortcut: italic},
    code: {icon: "</>", shortcut: code},
  };
  
  const config = decoratorConfig[decorator.name];
  if (config) {
    return {
      ...decorator,
      title: config.icon,
      shortcut: config.shortcut,
    };
  }
  
  return decorator;
};

// Toolbar components
function DecoratorButton({schemaType}: {schemaType: ToolbarDecoratorSchemaType}) {
  const decoratorButton = useDecoratorButton({schemaType});
  
  return (
    <ToolbarButton
      data-active={decoratorButton.snapshot.matches({enabled: "active"}) ? "true" : "false"}
      fontSize={1}
      mode="ghost"
      onClick={() => decoratorButton.send({type: "toggle"})}
      text={schemaType.title}
      title={schemaType.name}
      type="button"
    />
  );
}

function StyleButton({schemaType}: {schemaType: ToolbarStyleSchemaType}) {
  const styleSelector = useStyleSelector({schemaTypes: [schemaType]});
  
  return (
    <ToolbarButton
      data-active={styleSelector.snapshot.matches("enabled") ? "true" : "false"}
      fontSize={1}
      mode="ghost"
      onClick={() =>
        styleSelector.send({type: "toggle", style: schemaType.name})
      }
      text={schemaType.title}
      title={schemaType.name}
      type="button"
    />
  );
}

function Toolbar() {
  const toolbarSchema = useToolbarSchema({
    extendDecorator,
    extendStyle,
  });
  
  return (
    <ToolbarContainer>
      {toolbarSchema.styles?.map((style) => (
        <StyleButton key={style.name} schemaType={style} />
      ))}
      {toolbarSchema.decorators?.map((decorator) => (
        <DecoratorButton key={decorator.name} schemaType={decorator} />
      ))}
    </ToolbarContainer>
  );
}

// Convert Sanity Portable Text to PTE format
function convertSanityToPTE(sanityValue: unknown[]): Array<PortableTextBlock> | undefined {
  if (!Array.isArray(sanityValue) || sanityValue.length === 0) {
    return undefined;
  }
  
  // Sanity Portable Text format is compatible with PTE format
  // Both use the same structure: array of blocks with _type, _key, children, etc.
  return sanityValue as Array<PortableTextBlock>;
}

// Convert PTE format back to Sanity Portable Text
function convertPTEToSanity(pteValue: Array<PortableTextBlock> | undefined): unknown[] {
  if (!pteValue || pteValue.length === 0) {
    return [];
  }
  
  // Ensure each block has required Sanity fields
  return pteValue.map((block) => {
    // Ensure _key exists for Sanity
    if (!("_key" in block) || !block._key) {
      return {
        ...block,
        _key: `key-${Math.random().toString(36).substring(2, 9)}`,
      };
    }
    return block;
  }) as unknown[];
}

/**
 * Custom Portable Text Editor Input Component for Sanity Studio
 * 
 * This component provides a custom text editor using @portabletext/editor
 * as an alternative to Sanity's default rich text editor.
 * 
 * Features:
 * - Custom toolbar with style and decorator buttons
 * - Keyboard shortcuts support
 * - Seamless integration with Sanity's Portable Text format
 * 
 * Usage:
 * Add to a field definition:
 * ```ts
 * defineField({
 *   name: "content",
 *   type: "richText",
 *   // The richText type already includes this component
 * })
 * 
 * // Or use customRichText with useCustomEditor option:
 * customRichText(["block"], {
 *   useCustomEditor: true
 * })
 * ```
 */
export function PortableTextEditorInput(props: ArrayOfObjectsInputProps) {
  const {
    value = [],
    onChange,
  } = props;
  
  // Convert Sanity value to PTE format
  const initialValue = useMemo(() => convertSanityToPTE(value), [value]);
  
  // Local state for PTE value
  const [pteValue, setPteValue] = useState<Array<PortableTextBlock> | undefined>(initialValue);
  
  // Sync local state when prop value changes (e.g., from external updates)
  useEffect(() => {
    const converted = convertSanityToPTE(value);
    // Only update if the value actually changed to avoid unnecessary re-renders
    if (JSON.stringify(converted) !== JSON.stringify(pteValue)) {
      setPteValue(converted);
    }
  }, [value, pteValue]);
  
  // Handle PTE value changes
  const handlePTEChange = useCallback(
    (newValue: Array<PortableTextBlock> | undefined) => {
      setPteValue(newValue);
      const sanityValue = convertPTEToSanity(newValue);
      
      if (sanityValue.length === 0) {
        onChange(unset());
      } else {
        onChange(set(sanityValue));
      }
    },
    [onChange]
  );
  
  return (
    <Stack space={3}>
      <EditorProvider
        initialConfig={{
          schemaDefinition,
          initialValue: pteValue,
        }}
      >
        <EventListenerPlugin
          on={(event) => {
            if (event.type === "mutation") {
              handlePTEChange(event.value);
            }
          }}
        />
        <Toolbar />
        <EditorContainer>
          <PortableTextEditable
            renderStyle={renderStyle}
            renderDecorator={renderDecorator}
            renderBlock={(props) => <div>{props.children}</div>}
            renderListItem={(props) => <>{props.children}</>}
          />
        </EditorContainer>
      </EditorProvider>
    </Stack>
  );
}

