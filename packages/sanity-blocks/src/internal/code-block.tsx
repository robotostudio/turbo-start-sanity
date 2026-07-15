import { CopyButton } from "./copy-button";

// Short label shown in the language tile.
const BADGE_MAP: Record<string, string> = {
  ts: "TS",
  tsx: "TSX",
  js: "JS",
  groq: "GRQ",
  bash: "SH",
  json: "{ }",
  css: "CSS",
};

export interface CodeBlockValue {
  code?: string | null;
  language?: string | null;
  filename?: string | null;
}

export function CodeBlock({
  code,
  language,
  filename,
}: Readonly<CodeBlockValue>) {
  if (!code) {
    return null;
  }

  const badge = (language && BADGE_MAP[language]) || "TXT";

  // Line numbers are rendered as a fixed gutter column beside the scrolling
  // code, so they stay put during horizontal scroll and are excluded from copy.
  const lineCount = code.replace(/\n$/, "").split("\n").length;

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-border border-b bg-muted px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-6 min-w-6 place-items-center rounded border border-border bg-background px-1.5 font-mono font-semibold text-[10px] text-muted-foreground uppercase"
          >
            {badge}
          </span>
          {filename ? (
            <span className="truncate font-mono text-muted-foreground text-xs">
              {filename}
            </span>
          ) : null}
        </div>
        <CopyButton code={code} />
      </div>
      <div className="rich-code flex text-sm leading-relaxed">
        <div aria-hidden="true" className="rich-code-gutter font-mono">
          {Array.from({ length: lineCount }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <pre className="rich-code-pre overflow-x-auto font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  );
}
