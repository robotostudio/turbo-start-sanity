import type { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from "puppeteer";
import { Logger} from "@workspace/logger";
import { getSanityClient } from "./utils";


const logger = new Logger("download-all-block-preview");

const DEFAULT_PAGE_SLUG = "/";

const VIEWPORT_CONFIG = {
  width: 1920,
  height: 1080,
} as const;

const BLOCK_SELECTORS = {
  element: "[data-block-type]",
  typeAttribute: "data-block-type",
} as const;

const NAVIGATION_OPTIONS = {
  waitUntil: "networkidle2" as const,
} as const;

const PAGEBUILDER_BLOCK_TYPES_QUERY = `*[defined(slug.current) && slug.current == $slug][0].pageBuilder[]._type`;

function generateScreenshotFilename(slug: string, prefix = "page"): string {
  const sanitizedSlug = slug === "/" ? "home" : slug.replace(/^\//, "").replace(/\//g, "_");
  return `${prefix}_${sanitizedSlug}.png`;
}

function generateBlockScreenshotFilename(
  slug: string,
  blockType: string,
  index: number,
): string {
  const sanitizedSlug = slug === "/" ? "home" : slug.replace(/^\//, "").replace(/\//g, "_");
  return `block_${sanitizedSlug}_${blockType}_${index}.png`;
}



interface BlockScreenshotInfo {
  type: string | null;
  index: number;
  handle: ElementHandle<Element>;
}

interface ScreenshotResult {
  fullPagePath: string;
  blockPaths: string[];
}

function validateEnvironment(): string {
  const previewUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;

  if (!previewUrl) {
    logger.error("SANITY_STUDIO_PRESENTATION_URL environment variable is not set");
    throw new Error(
      "SANITY_STUDIO_PRESENTATION_URL environment variable is not set. " +
        "Please configure it in your .env file.",
    );
  }

  logger.info(`Environment validated: ${previewUrl}`);
  return previewUrl;
}


async function fetchPageBuilderBlockTypes(slug: string): Promise<string[]> {
  logger.info(`Fetching page builder blocks for slug: ${slug}`);
  
  const client = getSanityClient();
  const blockTypes = await client.fetch<string[]>(
    PAGEBUILDER_BLOCK_TYPES_QUERY,
    { slug },
  );

  const uniqueBlockTypes = new Set(blockTypes);
  const result = Array.from(uniqueBlockTypes);
  
  logger.info(`Found ${result.length} unique block types: ${result.join(", ")}`);
  return result;
}

async function createConfiguredPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIG);
  return page;
}

async function closeBrowserSafely(browser: Browser): Promise<void> {
  try {
    await browser.close();
    logger.info("Browser closed successfully");
  } catch (error) {
    logger.warn("Failed to close browser gracefully", error);
  }
}

async function navigateToPage(page: Page, baseUrl: string, slug: string): Promise<void> {
  const fullUrl = `${baseUrl}${slug}`;

  logger.info(`Navigating to: ${fullUrl}`);
  await page.goto(fullUrl, NAVIGATION_OPTIONS);
  await page.waitForSelector(BLOCK_SELECTORS.element);
  logger.info("Page loaded and blocks detected");
}

async function captureBlockScreenshots(page: Page, pageSlug: string): Promise<string[]> {
  const blockHandles = await page.$$(BLOCK_SELECTORS.element);
  logger.info(`Capturing ${blockHandles.length} block screenshots...`);
  
  const screenshotPaths: string[] = [];

  const blockInfos: BlockScreenshotInfo[] = await Promise.all(
    blockHandles.map(async (handle, index) => {
      const blockType = await handle.evaluate(
        (node, attributeName) => node.getAttribute(attributeName),
        BLOCK_SELECTORS.typeAttribute,
      );

      return { type: blockType, index, handle };
    }),
  );

  for (const blockInfo of blockInfos) {
    const screenshotPath = generateBlockScreenshotFilename(
      pageSlug,
      blockInfo.type ?? "unknown",
      blockInfo.index,
    );

    await blockInfo.handle.screenshot({ path: screenshotPath });
    screenshotPaths.push(screenshotPath);
  }

  logger.info(`Captured ${screenshotPaths.length} block screenshots`);
  return screenshotPaths;
}


async function capturePageScreenshots(
  previewUrl: string,
  pageSlug: string,
): Promise<ScreenshotResult> {
  logger.info("Launching browser...");
  const browser = await puppeteer.launch();

  try {
    const page = await createConfiguredPage(browser);
    await navigateToPage(page, previewUrl, pageSlug);

    const fullPagePath = generateScreenshotFilename(pageSlug, "fullpage");
    logger.info(`Capturing full page screenshot: ${fullPagePath}`);
    await page.screenshot({
      path: fullPagePath,
      fullPage: true,
    });

    const blockPaths = await captureBlockScreenshots(page, pageSlug);

    return { fullPagePath, blockPaths };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function executeScreenshotCapture(pageSlug = DEFAULT_PAGE_SLUG): Promise<void> {
  logger.info(`Starting screenshot capture for page: ${pageSlug}`);
  
  const previewUrl = validateEnvironment();
  const blockTypes = await fetchPageBuilderBlockTypes(pageSlug);

  const result = await capturePageScreenshots(previewUrl, pageSlug);

  logger.info("Screenshot capture completed successfully");
  logger.info(`Page slug: ${pageSlug}`);
  logger.info(`Full page: ${result.fullPagePath}`);
  logger.info(`Block screenshots: ${result.blockPaths.length} files`);
  logger.info(`Block types: ${blockTypes.join(", ")}`);
}

async function main(): Promise<void> {
  const pageSlug = process.argv[2] || DEFAULT_PAGE_SLUG;

  try {
    await executeScreenshotCapture(pageSlug);
  } catch (error) {
    logger.error("Screenshot capture failed", error);
    throw error;
  }
}

main().catch((error) => {
  logger.error("Fatal error occurred", error);
  process.exit(1);
});
