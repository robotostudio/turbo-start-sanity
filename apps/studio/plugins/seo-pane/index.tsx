import { SearchIcon } from "@sanity/icons";
import { lazy } from "react";
import type { DocumentInspectorProps } from "sanity";
import { defineDocumentInspector, definePlugin } from "sanity";

export type SeoPaneOptions = {
  types: string[];
  baseUrl: string;
  apiUrl: string;
};

export const seoPane = definePlugin<SeoPaneOptions>((options) => {
  const { types, baseUrl, apiUrl } = options;

  const seoInspector = defineDocumentInspector({
    name: "seo-preview",
    useMenuItem: () => ({
      icon: SearchIcon,
      title: "SEO Preview",
    }),
    component: lazy(() =>
      import("./serp-preview").then((mod) => ({
        default: (props: DocumentInspectorProps) => (
          <mod.SerpPreview {...props} baseUrl={baseUrl} apiUrl={apiUrl} />
        ),
      }))
    ),
  });

  return {
    name: "seo-pane",
    document: {
      inspectors: (prev, context) => {
        if (!types.includes(context.documentType)) {
          return prev;
        }
        return [seoInspector, ...prev];
      },
    },
  };
});
