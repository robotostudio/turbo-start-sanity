import { env } from "env";
import { chromium } from "playwright";

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
