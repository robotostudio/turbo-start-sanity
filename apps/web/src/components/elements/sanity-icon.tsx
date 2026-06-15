import { cn } from "@workspace/ui/lib/utils";
import { TriangleAlert } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { ComponentProps } from "react";

interface IconProps extends Omit<ComponentProps<"svg">, "src"> {
  icon?: string | null;
  alt?: string; // Add alt text prop for accessibility
}

export function SanityIcon({
  icon,
  className,
  alt,
  ...props
}: Readonly<IconProps>) {
  if (!icon) {
    return null;
  }

  return (
    <DynamicIcon
      {...props}
      name={icon as IconName}
      className={cn("flex size-12 items-center justify-center", className)}
      fallback={() => <TriangleAlert size={24} />}
      size={24}
    />
  );
}
