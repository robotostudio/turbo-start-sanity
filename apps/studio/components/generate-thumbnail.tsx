import { Button, Stack } from "@sanity/ui";
import { useFormValue } from "sanity";

/**
 * Renders block input fields and a control to request a preview thumbnail for the block.
 *
 * This component renders the default block fields provided by the form and adds a
 * "Generate preview thumbnail" button that requests a thumbnail generation from
 * the presentation service for the current document block (identified by `value._key` and `value._type`).
 *
 * @param props - Props passed by the Sanity form input. Expected to include the block `value` (with `_key`/`_type`) and `renderDefault` for rendering standard fields.
 * @returns The input UI for the page-builder block, including default fields and the thumbnail-generation button.
 */
export function PageBuilderBlockInput(props: any) {
  const { value, schemaType, onChange } = props;

  // value === the block object
  const blockKey = value?._key;
  const blockType = value?._type;

  const documentId = useFormValue(["_id"]);

  const generatePreview = async () => {
    console.log("Generating preview for block", blockKey, blockType);
    try {
        const response = await fetch(
          `${process.env.SANITY_STUDIO_PRESENTATION_URL}/api/generate-block-preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              docId: documentId,
              blockKey,
              blockType,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error("Error generating block preview:", error);
    }
  };

  const handleGeneratePreview = () => {
    generatePreview().catch((error) => {
      console.error("Unhandled error in preview generation:", error)
    });
  };

  return (
    <Stack space={3}>
      {/* default block fields */}
      {props.renderDefault(props)}

      <Button
        text="Generate preview thumbnail"
        tone="primary"
        onClick={handleGeneratePreview}
      />
    </Stack>
  );
}