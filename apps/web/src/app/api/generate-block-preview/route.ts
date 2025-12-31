import { NextResponse } from "next/server";

import { uploadThumbnail } from "@/lib/sanity/thunmbnail-upload";
import { generateThumbnail } from "@/lib/thumbnail-generator";

/**
 * Generates a thumbnail for a specified document block and uploads it to storage.
 *
 * @returns A JSON NextResponse:
 * - `{ success: true }` on success.
 * - `{ error: "Missing docId or blockKey" }` with status 400 if required fields are missing.
 * - `{ error: "Internal server error" }` with status 500 on failure.
 */
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