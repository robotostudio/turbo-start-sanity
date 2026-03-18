import { TriangleAlert } from "lucide-react";
import { createElement, type ReactNode } from "react";

export interface SlugValue {
  current?: string | null;
}

export interface ReferenceValue {
  slug?: SlugValue | null;
}

export interface CustomUrlValue {
  external?: string | null;
  internal?: ReferenceValue | null;
  openInNewTab?: boolean | null;
  type?: string | null;
}

export interface ButtonValue {
  _key?: string | null;
  text?: string | null;
  url?: CustomUrlValue | null;
  variant?: string | null;
}

export interface PortableTextSpan {
  _type?: string;
  text?: string | null;
}

export interface PortableTextBlock {
  _key?: string | null;
  _type?: string;
  alt?: string | null;
  caption?: string | null;
  children?: PortableTextSpan[] | null;
  style?: string | null;
}

export type PortableTextValue = PortableTextBlock[] | null | undefined;

export interface SanityImageValue {
  alt?: string | null;
  asset?: {
    _ref?: string | null;
  } | null;
}

export const getHref = (url?: CustomUrlValue | null) => {
  const isSafeHref = (href: string) => {
    if (href.startsWith("/") || href.startsWith("#")) return true;
    try {
      const parsed = new URL(href);
      return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  if (!url) {
    return undefined;
  }

  if (url.type === "internal") {
    const slug = url.internal?.slug?.current;
    return slug ? `/${slug.replace(/^\/+/, "")}` : undefined;
  }

const external = url.external?.trim();
  if (!external) {
    return undefined;
  }
  return isSafeHref(external) ? external : undefined;
};

export const portableTextToPlainText = (value?: PortableTextValue) =>
  (value ?? [])
    .map((block) => {
      if (block._type === "image") {
        const captionTrim = (block.caption ?? "").trim();
        return captionTrim || (block.alt ?? "").trim() || "";
      }

      return (block.children ?? [])
        .map((child) => child.text ?? "")
        .join("")
        .trim();
    })
    .filter(Boolean)
    .join(" ");

export const renderPortableText = (value?: PortableTextValue) =>
  (value ?? []).map((block, index) => {
     const key = block._key ?? `block-${index}`;
    if (block._type === "image") {
      const captionTrim = (block.caption ?? "").trim();
      const text = captionTrim || (block.alt ?? "").trim() || null;
      return text ? <p key={key}>{text}</p> : null;
    }

    const text = (block.children ?? [])
      .map((child) => child.text ?? "")
      .join("")
      .trim();

    if (!text) {
      return null;
    }

    const style = block.style ?? "normal";
    const tag = /^h[2-6]$/.test(style) ? style : "p";

    return createElement(tag, { key }, text);
  });

export const renderButtons = (buttons?: ButtonValue[] | null) => {
  if (!buttons?.length) {
    return null;
  }

  return (
    <ul>
      {buttons.map((button, index) => {
        const raw = button.text?.trim();
        const text = raw?.length ? raw : undefined;
        const href = getHref(button.url);

        return (
          <li key={button._key ?? `button-${index}`}>
            {href ? (
              <a
                href={href}
                rel={
                  button.url?.openInNewTab ? "noopener noreferrer" : undefined
                }
                target={button.url?.openInNewTab ? "_blank" : undefined}
              >
                {text}
              </a>
            ) : (
              <span>{text}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const IconBadge = ({ name }: { name?: string | null }) => {
  if (!name) {
    return <TriangleAlert size={16} />;
  }

  return <span>{name}</span>;
};

export const renderOptionalHeading = (
  content: string | null | undefined,
  tag: "h2" | "h3" | "p"
): ReactNode => {
  const normalized = content?.trim();
  if (!normalized) {
    return null;
  }

  if (tag === "h2") {
    return <h2>{normalized}</h2>;
  }

  if (tag === "h3") {
    return <h3>{normalized}</h3>;
  }

  return <p>{normalized}</p>;
};
