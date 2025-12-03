import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    useCdn: false,
    apiVersion: "2025-05-08",
  });

  const { beforeSlug, slug } = event.data;

  if (!(slug && beforeSlug)) {
    return;
  }
  if (slug === beforeSlug) {
    return;
  }
  // check if redirect already exists
  const existingRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $beforeSlug][0]`,
    { beforeSlug }
  );
  if (existingRedirect) {
    return;
  }
  // check for loops
  const loopRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $slug && destination.current == $beforeSlug][0]`,
    { slug, beforeSlug }
  );
  if (loopRedirect) {
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
    await client.create(redirect);
  } catch {
    // Silently handle errors
  }
});
