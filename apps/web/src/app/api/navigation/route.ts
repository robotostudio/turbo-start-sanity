import { getDynamicFetchOptions } from "@workspace/sanity/live";
import { NextResponse } from "next/server";

import { getNavigationData } from "@/lib/navigation";

export async function GET() {
  // Forward resolved stega so the navbar's SWR refresh keeps Visual Editing overlays in draft mode.
  const { perspective, stega } = await getDynamicFetchOptions();
  const data = await getNavigationData({ perspective, stega });
  return NextResponse.json(data);
}
