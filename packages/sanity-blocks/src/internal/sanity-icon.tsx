import { cn } from "@workspace/ui/lib/utils";
import { TriangleAlert } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { type ComponentProps, memo } from "react";

interface IconProps extends Omit<ComponentProps<"svg">, "src"> {
  icon?: string | null;
  alt?: string;
}

export const SanityIcon = memo(function SanityIconUnmemorized({
  icon,
  className,
  alt,
  ...props
}: IconProps) {
  if (!icon) {
    return null;
  }

  return (
    <DynamicIcon
      {...props}
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      role={alt ? "img" : undefined}
      className={cn("flex size-12 items-center justify-center", className)}
      fallback={() => <TriangleAlert size={24} />}
      name={icon as IconName}
      size={24}
    />
  );
});
