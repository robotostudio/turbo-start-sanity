"use client";

import { useOptimistic } from "@sanity/visual-editing/react";
import { env } from "@workspace/env/client";
import { CTABlock } from "@workspace/sanity-blocks/cta/index";
import { FaqAccordion } from "@workspace/sanity-blocks/faq-accordion/index";
import { FeatureCardsWithIcon } from "@workspace/sanity-blocks/feature-cards-icon/index";
import { HeroBlock } from "@workspace/sanity-blocks/hero/index";
import { ImageLinkCards } from "@workspace/sanity-blocks/image-link-cards/index";
import { RichTextBlock } from "@workspace/sanity-blocks/rich-text-block/index";
import { SubscribeNewsletter } from "@workspace/sanity-blocks/subscribe-newsletter/index";
import { createDataAttribute } from "next-sanity";

import { FaqJsonLd } from "@/components/json-ld";
import type { PageBuilderBlock, PagebuilderType } from "@/types";

export type PageBuilderProps = {
  readonly pageBuilder?: PageBuilderBlock[];
  readonly id: string;
  readonly type: string;
};

type SanityDataAttributeConfig = {
  readonly id: string;
  readonly type: string;
  readonly path: string;
};

/**
 * Renders the component for a single block, asserting the query result
 * against its PagebuilderType so a GROQ or schema rename breaks the build
 * instead of silently passing through `any`.
 */
function renderBlockComponent(block: PageBuilderBlock) {
  switch (block?._type) {
    case "cta":
      return <CTABlock {...(block as PagebuilderType<"cta">)} />;
    case "faqAccordion": {
      const props = block as PagebuilderType<"faqAccordion">;
      return (
        <>
          <FaqJsonLd faqs={props.faqs ?? []} />
          <FaqAccordion {...props} />
        </>
      );
    }
    case "hero":
      return <HeroBlock {...(block as PagebuilderType<"hero">)} />;
    case "featureCardsIcon":
      return (
        <FeatureCardsWithIcon
          {...(block as PagebuilderType<"featureCardsIcon">)}
        />
      );
    case "subscribeNewsletter":
      return (
        <SubscribeNewsletter
          {...(block as PagebuilderType<"subscribeNewsletter">)}
        />
      );
    case "imageLinkCards":
      return (
        <ImageLinkCards {...(block as PagebuilderType<"imageLinkCards">)} />
      );
    case "richTextBlock":
      return <RichTextBlock {...(block as PagebuilderType<"richTextBlock">)} />;
    default:
      return null;
  }
}

/**
 * Helper function to create consistent Sanity data attributes
 */
function createSanityDataAttribute(config: SanityDataAttributeConfig): string {
  return createDataAttribute({
    id: config.id,
    baseUrl: env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    type: config.type,
    path: config.path,
  }).toString();
}

/**
 * Error fallback component for unknown block types
 */
function UnknownBlockError({
  blockType,
  blockKey,
}: {
  blockType: string;
  blockKey: string;
}) {
  return (
    <div
      aria-label={`Unknown block type: ${blockType}`}
      className="flex items-center justify-center rounded-lg border-2 border-muted-foreground/20 border-dashed bg-muted p-8 text-center text-muted-foreground"
      key={`${blockType}-${blockKey}`}
      role="alert"
    >
      <div className="space-y-2">
        <p>Component not found for block type:</p>
        <code className="rounded bg-background px-2 py-1 font-mono text-sm">
          {blockType}
        </code>
      </div>
    </div>
  );
}

/**
 * Hook to handle optimistic updates for page builder blocks
 */
function useOptimisticPageBuilder(
  initialBlocks: PageBuilderBlock[],
  documentId: string
) {
  // biome-ignore lint/suspicious/noExplicitAny: <any is used to allow for dynamic component rendering>
  return useOptimistic<PageBuilderBlock[], any>(
    initialBlocks,
    (currentBlocks, action) => {
      if (action.id === documentId && action.document?.pageBuilder) {
        return action.document.pageBuilder;
      }
      return currentBlocks;
    }
  );
}

/**
 * Custom hook for block component rendering logic
 */
function useBlockRenderer(id: string, type: string) {
  const createBlockDataAttribute = (blockKey: string) =>
    createSanityDataAttribute({
      id,
      type,
      path: `pageBuilder[_key=="${blockKey}"]`,
    });

  const renderBlock = (block: PageBuilderBlock) => {
    const content = block && renderBlockComponent(block);

    if (!content) {
      return (
        <UnknownBlockError
          blockKey={block?._key ?? ""}
          blockType={block?._type ?? "unknown"}
          key={`${block?._type}-${block?._key}`}
        />
      );
    }

    return (
      <div
        data-sanity={createBlockDataAttribute(block._key)}
        key={`${block._type}-${block._key}`}
      >
        {content}
      </div>
    );
  };

  return { renderBlock };
}

/**
 * PageBuilder component for rendering dynamic content blocks from Sanity CMS
 */
export function PageBuilder({
  pageBuilder: initialBlocks = [],
  id,
  type,
}: PageBuilderProps) {
  const blocks = useOptimisticPageBuilder(initialBlocks, id);
  const { renderBlock } = useBlockRenderer(id, type);

  const containerDataAttribute = createSanityDataAttribute({
    id,
    type,
    path: "pageBuilder",
  });

  if (!blocks.length) {
    return null;
  }

  return (
    <main
      className="mx-auto my-16 flex max-w-7xl flex-col gap-16"
      data-sanity={containerDataAttribute}
    >
      {blocks.map(renderBlock)}
    </main>
  );
}
