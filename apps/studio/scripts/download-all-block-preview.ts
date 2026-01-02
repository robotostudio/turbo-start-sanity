import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline";
import type { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from "puppeteer";
import { Logger } from "@workspace/logger";
import { getSanityClient } from "./utils";
import { convertToKebabCase } from "@/utils/helper";

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

const THUMBNAILS_DIR = "static/thumbnails";

const PAGEBUILDER_BLOCK_TYPES_QUERY = `*[defined(slug.current) && slug.current == $slug][0].pageBuilder[]._type`;


function generateBlockPreviewFilename(blockType: string): string {
  const kebabCaseType = convertToKebabCase(blockType);
  return `preview-${kebabCaseType}.jpg`;
}

function generateScreenshotFilename(slug: string, prefix = "page"): string {
  const sanitizedSlug = slug === "/" ? "home" : slug.replace(/^\//, "").replace(/\//g, "_");
  return `${prefix}_${sanitizedSlug}.png`;
}

function ensureThumbnailsDirectory(): void {
  if (!existsSync(THUMBNAILS_DIR)) {
    mkdirSync(THUMBNAILS_DIR, { recursive: true });
    logger.info(`Created directory: ${THUMBNAILS_DIR}`);
  }
}

async function promptUserConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function checkExistingFilesAndPrompt(
  blockTypes: string[],
): Promise<boolean> {
  const existingFiles = blockTypes.filter((type) => {
    const filename = generateBlockPreviewFilename(type);
    const filepath = join(THUMBNAILS_DIR, filename);
    return existsSync(filepath);
  });

  if (existingFiles.length === 0) {
    logger.info("No existing preview files found");
    return true;
  }

  logger.warn(`Found ${existingFiles.length} existing preview file(s):`);
  for (const type of existingFiles) {
    logger.warn(`  - ${generateBlockPreviewFilename(type)}`);
  }

  return await promptUserConfirmation(
    "\nDo you want to replace the existing files?",
  );
}



interface BlockScreenshotInfo {
  type: string;
  handle: ElementHandle<Element>;
  isFirstOfType: boolean;
}

interface ScreenshotResult {
  fullPagePath: string;
  blockPreviewPaths: string[];
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

async function captureBlockPreviewScreenshots(page: Page): Promise<string[]> {
  const blockHandles = await page.$$(BLOCK_SELECTORS.element);
  logger.info(`Found ${blockHandles.length} block elements on page`);

  const seenTypes = new Set<string>();
  const blockInfos: BlockScreenshotInfo[] = [];

  for (const handle of blockHandles) {
    const blockType = await handle.evaluate(
      (node, attributeName) => node.getAttribute(attributeName),
      BLOCK_SELECTORS.typeAttribute,
    );

    if (!blockType) continue;

    const isFirstOfType = !seenTypes.has(blockType);
    if (isFirstOfType) {
      seenTypes.add(blockType);
      blockInfos.push({ type: blockType, handle, isFirstOfType });
    }
  }

  logger.info(`Capturing preview for ${blockInfos.length} unique block types...`);
  const screenshotPaths: string[] = [];

  for (const blockInfo of blockInfos) {
    const filename = generateBlockPreviewFilename(blockInfo.type);
    const filepath = join(THUMBNAILS_DIR, filename);

    await blockInfo.handle.screenshot({
      path: filepath,
      type: "jpeg",
      quality: 90,
    });

    screenshotPaths.push(filepath);
    logger.info(`  ✓ ${filename}`);
  }

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

    const blockPreviewPaths = await captureBlockPreviewScreenshots(page);

    return { fullPagePath, blockPreviewPaths };
  } finally {
    await closeBrowserSafely(browser);
  }
}

async function executeScreenshotCapture(
  pageSlug = DEFAULT_PAGE_SLUG,
): Promise<void> {
  logger.info(`Starting screenshot capture for page: ${pageSlug}`);

  const previewUrl = validateEnvironment();
  const blockTypes = await fetchPageBuilderBlockTypes(pageSlug);

  ensureThumbnailsDirectory();

  const shouldProceed = await checkExistingFilesAndPrompt(blockTypes);

  if (!shouldProceed) {
    logger.info("Screenshot capture cancelled by user");
    return;
  }

  const result = await capturePageScreenshots(previewUrl, pageSlug);

  logger.info("\n✅ Screenshot capture completed successfully");
  logger.info(`📍 Page slug: ${pageSlug}`);
  logger.info(`📄 Full page: ${result.fullPagePath}`);
  logger.info(`🎨 Block previews: ${result.blockPreviewPaths.length} files`);
  logger.info(`📁 Preview location: ${THUMBNAILS_DIR}/`);
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
