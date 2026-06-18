export type PortableTextBlock = {
  _type: string;
  _key: string;
  style?: string;
  children?: Array<{ _type: string; text?: string }>;
  [key: string]: unknown;
};

export const PortableText = ({
  value,
}: {
  value?: PortableTextBlock[] | null;
}) => {
  if (!value) return null;
  return (
    <>
      {value.map((block) => {
        if (block._type !== "block") return null;
        const text = block.children?.map((c) => c.text ?? "").join("") ?? "";
        if (!text.trim()) return null;
        const style = block.style;
        if (style === "h1") return <h1 key={block._key}>{text}</h1>;
        if (style === "h2") return <h2 key={block._key}>{text}</h2>;
        if (style === "h3") return <h3 key={block._key}>{text}</h3>;
        if (style === "h4") return <h4 key={block._key}>{text}</h4>;
        return <p key={block._key}>{text}</p>;
      })}
    </>
  );
};

export type PortableTextReactComponents = Record<string, unknown>;
