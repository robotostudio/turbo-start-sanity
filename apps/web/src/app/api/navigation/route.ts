import { getNavigationData } from "@/lib/navigation";
import { NextResponse } from "next/server";

export const revalidate = 360; // every 5 minutes

export async function GET() {
  const data = await getNavigationData();
  return NextResponse.json(data);
}
