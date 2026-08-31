import type { ComponentProps } from "react";

export default function Link({
  href,
  children,
  ...props
}: ComponentProps<"a"> & { href?: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
