import "dotenv/config";
import {
  defineBlueprint,
  defineDocumentFunction,
  defineSyncTagInvalidateFunction,
} from "@sanity/blueprints";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId) {
  throw new Error(
    "SANITY_STUDIO_PROJECT_ID must be set to deploy the blueprint"
  );
}
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: "auto-redirect",
      src: "./functions/auto-redirect",
      memory: 2,
      timeout: 30,
      event: {
        on: ["publish"],
        filter: "delta::changedAny(slug.current)",
        projection:
          "{'beforeSlug': before().slug.current, 'slug': after().slug.current}",
      },
    }),
    defineSyncTagInvalidateFunction({
      name: "invalidate-tags",
      src: "./functions/invalidate-tags",
      // Scope to this dataset so non-prod publishes don't purge prod cache.
      event: {
        resource: { type: "dataset", id: `${projectId}.${dataset}` },
      },
    }),
  ],
});
