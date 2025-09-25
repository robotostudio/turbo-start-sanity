import { defineConfig, defineField } from "sanity";
import { assist } from "@sanity/assist";
import { visionTool } from "@sanity/vision";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";
import { iconPicker } from "sanity-plugin-icon-picker";
import { media } from "sanity-plugin-media";
import { documentInternationalization } from "@sanity/document-internationalization";

import { Logo } from "./components/logo";
import { SwedbankLogo } from "./components/swedbank-logo";
import { SparebankenLogo } from "./components/sparebanken-logo";
import { locations } from "./location";
import { presentationUrl } from "./plugins/presentation-url";
import { schemaTypes } from "./schemaTypes";
import { getWorkspaceStructure } from "./structures";
import { structure } from "./structure";
import { createPageTemplate, getPresentationUrl } from "./utils/helper";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

// Shared plugins configuration
const getPlugins = (workspaceName?: string) => [
  structureTool({
    structure: workspaceName
      ? getWorkspaceStructure(workspaceName) || structure
      : structure,
  }),
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
  documentInternationalization({
    supportedLanguages: [
      { id: "sv", title: "Svenska" },
      { id: "en", title: "English" },
    ],
    schemaTypes: schemaTypes.map((type) => type.name),
    metadataFields: [defineField({ name: "slug", type: "slug" })],
  }),
  assist(),
  visionTool(),
  iconPicker(),
  media(),
  presentationUrl(),
  unsplashImageAsset(),
];

// Shared form configuration
const getFormConfig = () => ({
  image: {
    assetSources: (sources: any[]) =>
      sources.filter((source) => source.name !== "sanity-default"),
  },
  file: {
    assetSources: (sources: any[]) =>
      sources.filter((source) => source.name !== "sanity-default"),
  },
});

// Shared document configuration
const getDocumentConfig = () => ({
  newDocumentOptions: (prev: any[], { creationContext }: any) => {
    const { type } = creationContext;
    if (type === "global") return [];
    return prev;
  },
});

// Shared schema configuration
const getSchemaConfig = () => ({
  types: schemaTypes,
  templates: createPageTemplate(),
});

// Workspace configurations
export const workspaces = [
  // Swedbank English
  defineConfig({
    name: "swedbank-en",
    title: "Swedbank (English)",
    basePath: "/en",
    projectId: projectId,
    dataset: dataset,
    icon: SwedbankLogo,
    plugins: getPlugins("swedbank-en"),
    form: getFormConfig(),
    document: getDocumentConfig(),
    schema: getSchemaConfig(),
  }),

  // Swedbank Swedish
  defineConfig({
    name: "swedbank-sv",
    title: "Swedbank (Svenska)",
    basePath: "/sv",
    projectId: projectId,
    dataset: dataset,
    icon: SwedbankLogo,
    plugins: getPlugins("swedbank-sv"),
    form: getFormConfig(),
    document: getDocumentConfig(),
    schema: getSchemaConfig(),
  }),

  // Swedbank Baltic
  defineConfig({
    name: "swedbank-baltic",
    title: "Swedbank (Baltic)",
    basePath: "/swedbank-baltic",
    projectId: projectId,
    dataset: dataset,
    icon: SwedbankLogo,
    plugins: getPlugins("swedbank-baltic"),
    form: getFormConfig(),
    document: getDocumentConfig(),
    schema: getSchemaConfig(),
  }),

  // Sparebanken Skåne
  defineConfig({
    name: "sparebanken-skane",
    title: "Sparebanken Skåne",
    basePath: "/sparebanken-skane",
    projectId: projectId,
    dataset: dataset,
    icon: SparebankenLogo,
    plugins: getPlugins("sparebanken-skane"),
    form: getFormConfig(),
    document: getDocumentConfig(),
    schema: getSchemaConfig(),
  }),
];
