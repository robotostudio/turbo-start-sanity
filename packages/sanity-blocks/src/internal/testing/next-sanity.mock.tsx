type Block = {
  _type: string;
  style?: string;
  children?: Array<{ _type: string; text?: string }>;
  [key: string]: unknown;
};

export const PortableText = ({
  value,
}: {
  value?: Block[] | null;
  components?: unknown;
}) => {
  if (!value) return null;
  return (
    <>
      {value.map((block, i) => {
        if (block._type !== "block") return null;
        const text = block.children?.map((c) => c.text ?? "").join("") ?? "";
        if (!text.trim()) return null;
        const style = block.style;
        if (style === "h1") return <h1 key={i}>{text}</h1>;
        if (style === "h2") return <h2 key={i}>{text}</h2>;
        if (style === "h3") return <h3 key={i}>{text}</h3>;
        if (style === "h4") return <h4 key={i}>{text}</h4>;
        return <p key={i}>{text}</p>;
      })}
    </>
  );
};

export type PortableTextReactComponents = Record<string, unknown>;
export type PortableTextBlock = Block;
