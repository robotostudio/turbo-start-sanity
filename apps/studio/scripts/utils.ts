import { createClient } from "@sanity/client";

// Add hr block support for rich text
export function getSanityClient() {
  const token = process.env.SANITY_API_TOKEN;
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.SANITY_STUDIO_DATASET;
  if (!(token && projectId && dataset)) {
    throw new Error(
      "SANITY_API_TOKEN, SANITY_STUDIO_PROJECT_ID, and SANITY_STUDIO_DATASET must be set"
    );
  }
  return createClient({
    projectId,
    dataset,
    useCdn: false,
    apiVersion: "2024-02-13",
    token,
  });
}
