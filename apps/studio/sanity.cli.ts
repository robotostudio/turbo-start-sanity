import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
const host = process.env.HOST_NAME;
const productionHostName = process.env.SANITY_STUDIO_PRODUCTION_HOSTNAME;

export default defineCliConfig({
  api: {
    projectId: projectId,
    dataset: dataset,
  },
  studioHost:
    host && host !== "main"
      ? `${host}-${productionHostName}`
      : productionHostName,
  autoUpdates: false,
});
