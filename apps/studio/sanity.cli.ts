import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

const productionHostName = "roboto-demo";

function getStudioHost(): string | undefined {
  const host = process.env.HOST_NAME;

  if (host && host !== "main") {
    return `${host}-${productionHostName}`;
  }

  return productionHostName;
}

const studioHost = getStudioHost();

if (studioHost) {
  console.log(
    `🪩 Sanity Studio Host: https://${studioHost}.sanity.studio`
  );
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: getStudioHost(),
  autoUpdates: false,
});
