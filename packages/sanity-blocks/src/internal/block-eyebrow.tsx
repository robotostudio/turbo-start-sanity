/**
 * The small "eyebrow" pill shown above a block's heading — a bordered chip with
 * an accent-green square and a mono uppercase label. Shared across page-builder
 * blocks so the label styling stays consistent. Renders nothing without text.
 */
export function BlockEyebrow({
  eyebrow,
}: Readonly<{ eyebrow?: string | null }>) {
  if (!eyebrow) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-2 self-start rounded-sm border border-border px-3 py-1.5">
      <span className="size-2 shrink-0 rounded-[1px] bg-accent-green" />
      <span className="font-light font-mono text-muted-foreground text-sm uppercase leading-5 tracking-[0.28px]">
        {eyebrow}
      </span>
    </span>
  );
}
