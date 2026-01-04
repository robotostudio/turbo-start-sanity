import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextReactComponents,
  stegaClean,
} from "next-sanity";

import type { SanityRichTextProps } from "@/types";
import { parseChildrenToSlug } from "@/utils";
import { ImageGallery } from "../sections/image-gallery";
import { SanityImage } from "./sanity-image";

const components: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h2
          className="scroll-m-20 pb-4 font-semibold text-3xl first:mt-0"
          id={slug}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h3 className="scroll-m-20 pb-4 font-semibold text-2xl" id={slug}>
          {children}
        </h3>
      );
    },
    h4: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h4 className="scroll-m-20 pb-4 font-semibold text-xl" id={slug}>
          {children}
        </h4>
      );
    },
    h5: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h5 className="scroll-m-20 pb-4 font-semibold text-lg" id={slug}>
          {children}
        </h5>
      );
    },
    h6: ({ children, value }) => {
      const slug = parseChildrenToSlug(value.children);
      return (
        <h6 className="scroll-m-20 pb-4 font-semibold text-base" id={slug}>
          {children}
        </h6>
      );
    },
    normal: ({ children }) => {
      return <p className="mb-4">{children}</p>;
    },
  },
  marks: {
    code: ({ children }) => (
      <code className="rounded-md border border-white/10 bg-opacity-5 p-1 text-sm lg:whitespace-nowrap">
        {children}
      </code>
    ),
    underline: ({ children }) => <u>{children}</u>,
    customLink: ({ children, value }) => {
      if (!value.href || value.href === "#") {
        return (
          <span className="underline decoration-dotted underline-offset-2">
            Link Broken
          </span>
        );
      }
      return (
        <Link
          aria-label={`Link to ${value?.href}`}
          className="underline decoration-dotted underline-offset-2"
          href={value.href}
          prefetch={false}
          target={value.openInNewTab ? "_blank" : "_self"}
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.id) {
        return null;
      }

      const { variant } = value;
      const cleanVariant = stegaClean(variant);
      if (cleanVariant === "full-bleed") {
        return (
          <figure className="my-8">
            <SanityImage
              className="h-full max-h-[75dvh] w-full object-cover"
              height={900}
              image={value}
              width={1600}
            />
            {value?.caption && (
              <figcaption className="mt-2 text-center text-sm">
                <PortableText
                  components={components}
                  value={value.caption as unknown as PortableTextBlock[]}
                />
              </figcaption>
            )}
          </figure>
        );
      }
      if (cleanVariant === "fit-to-container") {
        return (
          <figure className="mx-auto max-w-full">
            <SanityImage
              className="h-auto w-full rounded-lg"
              height={900}
              image={value}
              width={1600}
            />
            {value?.caption && (
              <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <PortableText
                  components={components}
                  value={value.caption as unknown as PortableTextBlock[]}
                />
              </figcaption>
            )}
          </figure>
        );
      }
      if (cleanVariant === "inset") {
        return (
          <figure className="mx-auto max-w-screen-sm">
            <SanityImage
              className="h-auto w-full rounded-lg"
              height={900}
              image={value}
              width={1600}
            />
            {value?.caption && (
              <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                <PortableText
                  components={components}
                  value={value.caption as unknown as PortableTextBlock[]}
                />
              </figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="my-8">
          <SanityImage
            className="h-auto w-full rounded-lg"
            height={900}
            image={value}
            width={1600}
          />
          {value?.caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <PortableText
                components={components}
                value={value.caption as unknown as PortableTextBlock[]}
              />
            </figcaption>
          )}
        </figure>
      );
    },
    imageGallery: ({ value }) => {
      const cleanColumnVariant = stegaClean(value?.columnVariant);
      if (!value?.images || value.images.length === 0) {
        return null;
      }
      return (
        <ImageGallery
          _key={value._key || "gallery"}
          _type="imageGallery"
          columnVariant={cleanColumnVariant}
          images={value.images}
        />
      );
    },
  },
  hardBreak: () => <br />,
};

export function RichText<T extends SanityRichTextProps>({
  richText,
  className,
}: {
  richText?: T | null;
  className?: string;
}) {
  if (!richText) {
    return null;
  }

  return (
    <div
      className={cn(
        "prose dark:prose-invert prose-p:my-8 max-w-none prose-headings:scroll-m-24 prose-h2:border-b prose-h2:pb-2 prose-h2:font-semibold prose-h2:text-3xl prose-headings:text-opacity-90 prose-ol:text-opacity-80 prose-ul:text-opacity-80 prose-a:decoration-dotted prose-h2:first:mt-0",
        "max-w-prose",
        className
      )}
    >
      <PortableText
        components={components}
        onMissingComponent={(_, { nodeType, type }) => {
          if (process.env.NODE_ENV === "development") {
            // biome-ignore lint/suspicious/noConsole: only in development
            console.warn(`Missing component: ${nodeType} for type: ${type}`);
          }
          return null;
        }}
        value={richText}
      />
    </div>
  );
}
