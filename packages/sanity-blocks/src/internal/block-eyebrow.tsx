import { cn } from "@workspace/tailwind-config/utils";

export function BlockEyebrow({
  className,
  eyebrow,
}: Readonly<{ className?: string; eyebrow?: string | null }>) {
  if (!eyebrow) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center self-start justify-self-start border border-border bg-background px-3 py-1.5 font-mono text-muted-foreground text-sm uppercase leading-[18px] tracking-[0.28px]",
        className
      )}
    >
      {eyebrow}
    </span>
  );
}
