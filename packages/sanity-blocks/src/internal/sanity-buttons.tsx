import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

export interface ButtonProps {
  _key?: string | null;
  text?: string | null;
  variant?: string | null;
  href?: string | null;
  openInNewTab?: boolean | null;
}

type ButtonVariant = ComponentProps<typeof Button>["variant"];

type SanityButtonsProps = {
  buttons?: ButtonProps[] | null;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "lg" | "default" | "icon" | null;
};

type SanityButtonRenderProps = {
  text?: string | null;
  href?: string | null;
  variant?: Exclude<ButtonVariant, null | undefined>;
  openInNewTab?: boolean | null;
  className?: string;
  size?: SanityButtonsProps["size"];
};

const VALID_VARIANTS = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;

function isValidVariant(v: string | null | undefined): v is Exclude<ButtonVariant, null | undefined> {
  return v != null && (VALID_VARIANTS as readonly string[]).includes(v);
}


function SanityButton({
  text,
  href,
  variant = "default",
  openInNewTab,
  className,
  size,
}: Readonly<SanityButtonRenderProps>) {
  if (!href) {
    return <Button>Link Broken</Button>;
  }

  return (
    <Button
      asChild
      className={cn("rounded-[10px]", className)}
      size={size ?? "default"}
      variant={variant ?? "default"}
    >
      <Link
        aria-label={`Navigate to ${text}`}
        href={href}
        target={openInNewTab ? "_blank" : "_self"}
        title={`Click to visit ${text}`}
      >
        {text}
      </Link>
    </Button>
  );
}

export function SanityButtons({
  buttons,
  className,
  buttonClassName,
  size = "default",
}: Readonly<SanityButtonsProps>) {
  if (!buttons?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row", className)}>
      {buttons.map((button) => (
        <SanityButton
          className={buttonClassName}
          href={button.href}
          key={`button-${button._key}`}
          openInNewTab={button.openInNewTab}
          size={size}
          text={button.text}
          variant={isValidVariant(button.variant) ? button.variant : "default"}
        />
      ))}
    </div>
  );
}
