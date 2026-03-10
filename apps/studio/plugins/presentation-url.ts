import type { SanityDocument } from "@sanity/client";
import { EarthGlobeIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useCallback } from "react";
import {
  type DocumentActionComponent,
  definePlugin,
  getPublishedId,
  type SlugValue,
  useEditState,
} from "sanity";
import { useRouter } from "sanity/router";

interface PresentationUrlAction {
  documentId: string;
  documentType: string;
}

function getDocumentSlug(
  draft?: SanityDocument<{ slug?: SlugValue }> | null,
  published?: SanityDocument<{ slug?: SlugValue }> | null
) {
  if (draft?.slug?.current) return draft.slug.current;
  if (published?.slug?.current) return published.slug.current;
  return undefined;
}

export const presentationUrl = definePlugin(() => ({
  name: "presentationUrl",
  document: {
    unstable_fieldActions: (props: DocumentActionComponent[]) => [
      {
        name: "open-in-presentation",
        useAction: ({ documentId, documentType }: PresentationUrlAction) => {
          const publishedId = getPublishedId(documentId);
          const doc = useEditState(publishedId, documentType);
          const router = useRouter();
          const toast = useToast();
          const slug = getDocumentSlug(doc?.draft, doc?.published);
          const handlePresentationOpen = useCallback(() => {
            if (!slug) {
              toast.push({
                title: "No slug found",
                status: "error",
                description: "Please ensure the document has a valid slug",
              });
              return;
            }
            router.navigateUrl({
              path: `/presentation?preview=${encodeURIComponent(slug)}`,
            });
          }, [slug, toast, router]);

          return {
            type: "action" as const,
            icon: EarthGlobeIcon,
            hidden: documentId === "root",
            disabled: !slug,
            renderAsButton: true,
            onAction: handlePresentationOpen,
            title: "Open in Presentation",
          };
        },
      },
      ...props,
    ],
  },
}));
