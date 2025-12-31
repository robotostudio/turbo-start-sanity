import { client } from "./client";


/**
 * Uploads an image to Sanity and sets it as the `previewThumbnail` for a specific `pageBuilder` block.
 *
 * Sets the `pageBuilder[_key=="<blockKey>"].previewThumbnail` field on the document to an object referencing the uploaded asset.
 *
 * @param docId - The ID of the document to patch.
 * @param blockKey - The `_key` of the target `pageBuilder` block whose `previewThumbnail` will be updated.
 * @param image - The image data to upload as a Buffer.
 */
export async function uploadThumbnail(docId: string, blockKey: string, image: Buffer) {
  const asset = await client.assets.upload("image", image);

  await client
    .patch(docId)
    .set({
      [`pageBuilder[_key=="${blockKey}"].previewThumbnail`]: {
        _type: "image",
        asset: { _ref: asset._id },
      },
    })
    .commit();
}