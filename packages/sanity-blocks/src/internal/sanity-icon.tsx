import { isIconName } from "@robotostudio/sanity-plugin-lucide-icon-picker";
import { Logger } from "@workspace/logger";
import { cn } from "@workspace/tailwind-config/utils";
import { TriangleAlert } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import type { ComponentProps } from "react";

type IconProps = Omit<ComponentProps<"svg">, "src"> & {
  icon?: string | null;
  alt?: string;
};

const ICON_SIZE = 24;

const logger = new Logger("SanityIcon");

const FallbackIcon = () => <TriangleAlert size={ICON_SIZE} />;

export function SanityIcon({
  icon,
  className,
  alt,
  ...props
}: Readonly<IconProps>) {
  if (!icon) {
    return null;
  }

  // Stored values are arbitrary strings: the picker only writes valid names,
  // but import scripts, migrations and hand-edited documents can persist
  // anything. Guard instead of casting so a bad name is diagnosed rather than
  // silently swallowed by DynamicIcon's fallback.
  if (!isIconName(icon)) {
    logger.warn(
      `"${icon}" is not a Lucide icon name; rendering the fallback icon instead.`
    );
    return <FallbackIcon />;
  }

  return (
    <DynamicIcon
      {...props}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      role={alt ? "img" : undefined}
      className={cn("flex size-12 items-center justify-center", className)}
      fallback={FallbackIcon}
      name={icon}
      size={ICON_SIZE}
    />
  );
}
