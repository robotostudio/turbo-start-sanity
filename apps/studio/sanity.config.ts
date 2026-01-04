import { assist } from "@sanity/assist";
import { codeInput } from "@sanity/code-input";
import { crossDatasetDuplicator } from "@sanity/cross-dataset-duplicator";
import { debugSecrets } from "@sanity/preview-url-secret/sanity-plugin-debug-secrets";
import { type Config, defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";
import { iconPicker } from "sanity-plugin-icon-picker";
import { media } from "sanity-plugin-media";
import { muxInput } from "sanity-plugin-mux-input";

import { Logo } from "./components/logo";
import { locations } from "./location";
import { arrayClearButton } from "./plugins/array-operations-input/array-clear-button";
import { presentationUrl } from "./plugins/presentation-url";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";
import { getPresentationUrl } from "./utils/helper";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
const title = process.env.SANITY_STUDIO_TITLE;

export default defineConfig({
  announcements: {
    enabled: false,
  },
  name: "default",
  title,
  icon: Logo,
  projectId,
  dataset,
  releases: {
    enabled: true,
  },
  plugins: [
    presentationTool({
      resolve: {
        locations,
      },
      previewUrl: {
        origin: getPresentationUrl(),
        previewMode: {
          enable: "/api/presentation-draft",
        },
      },
    }),
    structureTool({
      structure,
    }),
    arrayClearButton(),
    presentationUrl(),
    unsplashImageAsset(),
    media(),
    iconPicker(),
    muxInput({}),
    assist(),
    debugSecrets(),
    codeInput(),
    crossDatasetDuplicator(),
  ], // push structure tool to first position in the tool navbar
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      const { type } = creationContext;
      if (type === "global") {
        return prev.filter(
          (template) =>
            ![
              "homePage",
              "navbar",
              "footer",
              "settings",
              "blogIndex",
              "assist.instruction.context",
              "media.tag",
            ].includes(template?.templateId)
        );
      }
      return prev;
    },
  },
  schema: {
    types: schemaTypes,
    templates: [
      {
        id: "nested-page-template",
        title: "Nested Page",
        schemaType: "page",
        value: (props: { slug?: string; title?: string }) => ({
          ...(props.slug
            ? { slug: { current: props.slug, _type: "slug" } }
            : {}),
          ...(props.title ? { title: props.title } : {}),
        }),
        parameters: [
          {
            name: "slug",
            type: "string",
          },
        ],
      },
    ],
  },
}) as Config;
