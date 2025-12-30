import { NextResponse } from "next/server";

import { uploadThumbnail } from "@/lib/sanity/thunmbnail-upload";
import { generateThumbnail } from "@/lib/thumbnail-generator";

export async function POST(req: Request) {
  try {
    const { docId, blockKey } = await req.json();

    if(!docId || !blockKey) {
      return NextResponse.json({ error: "Missing docId or blockKey" }, { status: 400 });
    }
  
    const image = await generateThumbnail(docId, blockKey);
    await uploadThumbnail(docId, blockKey, image);
  
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error generating block preview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
