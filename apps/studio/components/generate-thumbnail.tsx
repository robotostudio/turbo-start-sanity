import { Button, Stack } from "@sanity/ui";
import { useFormValue } from "sanity";

export function PageBuilderBlockInput(props: any) {
  const { value, schemaType, onChange } = props;

  // value === the block object
  const blockKey = value?._key;
  const blockType = value?._type;

  const documentId = useFormValue(["_id"]);

  const generatePreview = async () => {
    await fetch(
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
  };

  return (
    <Stack space={3}>
      {/* default block fields */}
      {props.renderDefault(props)}

      <Button
        text="Generate preview thumbnail"
        tone="primary"
        onClick={generatePreview}
      />
    </Stack>
  );
}
