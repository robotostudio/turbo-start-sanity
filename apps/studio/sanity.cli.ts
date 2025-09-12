import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

/**
 * Returns the correct studio host based on environment variables.
 * - If HOST_NAME is set and not "main", returns `${HOST_NAME}-${PRODUCTION_HOSTNAME}`
 * - If HOST_NAME is "main" or not set, returns PRODUCTION_HOSTNAME
 * - If PRODUCTION_HOSTNAME is not set, returns a default using projectId
 */
function getStudioHost(): string | undefined {
  const host = process.env.HOST_NAME;
  const productionHostName = process.env.SANITY_STUDIO_PRODUCTION_HOSTNAME;
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

  if (productionHostName) {
    if (host && host !== "main") {
      // Sanitize branch name by replacing slashes with hyphens
      // e.g. feature/new-component -> feature-new-component
      const sanitizedHost = host.replace(/\//g, "-");
      return `${sanitizedHost}-${productionHostName}`;
    }

    return productionHostName;
  }

  if (projectId) return `${projectId}`;

  return undefined;
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: getStudioHost(),
  autoUpdates: false,
});
