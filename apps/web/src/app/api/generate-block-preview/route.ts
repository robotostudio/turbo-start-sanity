import { NextResponse } from "next/server";

import { uploadThumbnail } from "@/lib/sanity/thunmbnail-upload";
import { generateThumbnail } from "@/lib/thumbnail-generator";

export async function POST(req: Request) {
  const { docId, blockKey } = await req.json();

  const image = await generateThumbnail(docId, blockKey);
  await uploadThumbnail(docId, blockKey, image);

  return NextResponse.json({ success: true });
}
