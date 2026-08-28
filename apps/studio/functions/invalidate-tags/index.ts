import { syncTagInvalidateEventHandler } from "@sanity/functions";
import { Logger } from "@workspace/logger";

const logger = new Logger("InvalidateTags");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SECRET = process.env.SANITY_REVALIDATE_SECRET;

export const handler = syncTagInvalidateEventHandler(
  async ({ event, done }) => {
    const { syncTags } = event.data;

    // Throw (don't ack) on misconfig/failure so Sanity retries instead of dropping.
    if (!SITE_URL) {
      throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
    }
    if (!SECRET) {
      throw new Error("SANITY_REVALIDATE_SECRET is not configured");
    }

    const res = await fetch(`${SITE_URL}/api/revalidate-sync-tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
      },
      body: JSON.stringify({ syncTags }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(
        `Revalidate webhook failed: HTTP ${res.status} for ${syncTags.length} tags`
      );
    }
    logger.info(`Revalidated ${syncTags.length} tags, HTTP ${res.status}`);

    const response = await done(syncTags);
    logger.info(
      `Invalidation complete, Sanity responded with HTTP ${response.status}`
    );
  }
);
