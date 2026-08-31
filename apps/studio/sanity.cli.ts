import { Logger } from "@workspace/logger";
import "dotenv/config";
import path from "node:path";
import { defineCliConfig } from "sanity/cli";

const logger = new Logger("SanityCLI");

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
// User-application ID used by `sanity deploy`. Generated on the first deploy;
// set it as SANITY_STUDIO_APP_ID so later deploys target the same app. Replaces
// the deprecated `studioHost` / *.sanity.studio mechanism.
// https://www.sanity.io/docs/help/studio-host-user-applications
const appId = process.env.SANITY_STUDIO_APP_ID || undefined;

if (!projectId) {
  logger.warn(
    "Missing or invalid SANITY_STUDIO_PROJECT_ID - some features may not work"
  );
}
if (!dataset) {
  logger.warn(
    "Missing or invalid SANITY_STUDIO_DATASET - some features may not work"
  );
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    appId,
    autoUpdates: false,
  },
  schemaExtraction: {
    enabled: true,
    enforceRequiredFields: true,
  },
  typegen: {
    enabled: true,
    formatGeneratedCode: true,
    path: "../../packages/sanity/src/**/*.{ts,tsx,js,jsx}",
    schema: "schema.json",
    generates: "../../packages/sanity/src/sanity.types.ts",
    overloadClientMethods: true,
  },
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  },
});
