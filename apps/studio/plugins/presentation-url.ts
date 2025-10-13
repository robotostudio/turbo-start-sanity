import { EarthGlobeIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useCallback } from "react";
import {
  type DocumentActionComponent,
  definePlugin,
  useGetFormValue,
} from "sanity";
import { useRouter } from "sanity/router";

type PresentationUrlAction = {
  documentId: string;
};

export const presentationUrl = definePlugin(() => ({
  name: "presentationUrl",
  document: {
    unstable_fieldActions: (props: DocumentActionComponent[]) => [
      {
        name: "open-in-presentation",
        useAction: ({ documentId }: PresentationUrlAction) => {
          const getFormValue = useGetFormValue();
          const router = useRouter();
          const toast = useToast();

          const handlePresentationOpen = useCallback(() => {
            const slug = getFormValue(["slug", "current"]);

            if (typeof slug !== "string") {
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
          }, [getFormValue, toast, router]);

          return {
            type: "action" as const,
            icon: EarthGlobeIcon,
            hidden: documentId === "root",
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
