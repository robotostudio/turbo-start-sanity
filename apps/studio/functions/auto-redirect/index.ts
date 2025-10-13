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
    `*[_type == "redirect" && source.current == "${beforeSlug}"][0]`
  );
  if (existingRedirect) {
    return;
  }
  // check for loops
  const loopRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == "${slug}" && destination.current == "${beforeSlug}"][0]`
  );
  if (loopRedirect) {
    return;
  }
  const redirect = {
    _type: "redirect",
    source: {
      current: beforeSlug,
    },
    destination: {
      current: slug,
    },
    permanent: true,
  };

  try {
    const _res = await client.create(redirect);
  } catch (_error) {}
});
