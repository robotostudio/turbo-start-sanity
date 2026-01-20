import Link from "next/link";

import type { MenuLinkProps } from "@/types";
import { SanityIcon } from "./sanity-icon";

export function MenuLink({
  name,
  href,
  description,
  icon,
  onClick,
}: MenuLinkProps) {
  if (!href) return null;

  return (
    <Link
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
      href={href}
      onClick={onClick}
    >
      {icon && (
        <SanityIcon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          icon={icon}
        />
      )}
      <div className="grid gap-1">
        <div className="font-medium leading-none group-hover:text-accent-foreground">
          {name}
        </div>
        {description && (
          <div className="line-clamp-2 text-muted-foreground text-sm">
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}
