import { Slot } from "@radix-ui/react-slot";
import { cn } from "@workspace/tailwind-config/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const buttonVariants = cva(
  "focus-ring inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-base leading-6 transition-[color,background-color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground duration-150 ease-out hover:bg-accent-green hover:text-accent-green-foreground",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "box-border border border-foreground bg-transparent text-foreground duration-150 ease-out hover:bg-foreground hover:text-background active:bg-foreground/90",
        secondary:
          "bg-accent-green text-accent-green-foreground duration-150 ease-out hover:bg-primary hover:text-primary-foreground",
        ghost:
          "hover:bg-zinc-50 hover:text-accent-foreground dark:hover:bg-zinc-800",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 has-[>svg]:px-6",
        sm: "h-10 px-5 has-[>svg]:px-4",
        lg: "h-12 px-8 has-[>svg]:px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      suppressHydrationWarning
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
