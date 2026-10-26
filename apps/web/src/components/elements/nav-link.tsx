"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentProps, Suspense } from "react";

type NavLinkProps = ComponentProps<typeof Link> & { href: string };

function CurrentNavLink(props: NavLinkProps) {
  const pathname = usePathname();
  return (
    <Link
      aria-current={props.href === pathname ? "page" : undefined}
      {...props}
    />
  );
}

export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <CurrentNavLink {...props} />
    </Suspense>
  );
}
