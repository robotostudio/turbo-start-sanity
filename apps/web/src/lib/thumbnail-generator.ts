import { env } from "env";
import { chromium } from "playwright";

/**
 * Generates a PNG thumbnail image of the preview page for a specific document block.
 *
 * @param docId - The document identifier used to construct the preview URL
 * @param blockKey - The block key that identifies the specific block within the document
 * @returns A `Buffer` containing the screenshot image (PNG) of the preview page
 */
export async function generateThumbnail(docId: string, blockKey: string) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
    });
  
    await page.goto(
      `${env.NEXT_PUBLIC_VERCEL_URL}/preview?docId=${docId}&blockKey=${blockKey}`,
      { waitUntil: "networkidle" }
    );
  
    const buffer = await page.screenshot();
    await browser.close();
  
    return buffer;
  } finally{
    browser.close();
  }
}