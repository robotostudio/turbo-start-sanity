export function BlockEyebrow({
  eyebrow,
}: Readonly<{ eyebrow?: string | null }>) {
  if (!eyebrow) {
    return null;
  }

  return (
    <span className="inline-flex w-fit items-center self-start justify-self-start border border-border bg-background px-3 py-1.5 font-mono text-muted-foreground text-sm uppercase leading-[18px] tracking-[0.28px]">
      {eyebrow}
    </span>
  );
}
