import { client } from "./client";


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
