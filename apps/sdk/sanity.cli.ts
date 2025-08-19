import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  app: {
    organizationId: process.env.SANITY_APP_ORG_ID!,
    entry: "./src/App.tsx",
  },
});
