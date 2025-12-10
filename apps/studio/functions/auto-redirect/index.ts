import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";
import { Logger } from "@workspace/logger";

import { API_VERSION } from "@/utils/constant";

const logger = new Logger("AutoRedirect");

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    useCdn: false,
    apiVersion: API_VERSION,
  });

  const { beforeSlug, slug } = event.data;

  if (!(slug && beforeSlug)) {
    logger.info("No slug or beforeSlug provided");
    return;
  }
  if (slug === beforeSlug) {
    logger.info("Slug did not change");
    return;
  }
  // check if redirect already exists
  const existingRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $beforeSlug][0]`,
    { beforeSlug }
  );
  if (existingRedirect) {
    logger.info(`Redirect already exists for source ${beforeSlug}`);
    return;
  }
  // check for loops
  const loopRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $slug && destination.current == $beforeSlug][0]`,
    { slug, beforeSlug }
  );
  if (loopRedirect) {
    logger.warning("Redirect loop detected");
    return;
  }
  const redirect = {
    _type: "redirect",
    status: "active",
    source: {
      current: beforeSlug,
    },
    destination: {
      current: slug,
    },
    permanent: "true",
  };

  try {
    const res = await client.create(redirect);
    logger.info(
      `Redirect from ${beforeSlug} to ${slug} was created`,
      JSON.stringify(res)
    );
  } catch (error) {
    logger.error("Failed to create redirect", error);
  }
});
