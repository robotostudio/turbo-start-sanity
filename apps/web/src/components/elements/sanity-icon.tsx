import { cn } from "@workspace/ui/lib/utils";
import { TriangleAlert } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { ComponentProps } from "react";
import { memo } from "react";

interface IconProps extends Omit<ComponentProps<"svg">, "src"> {
  icon?: string | null;
  alt?: string; // Add alt text prop for accessibility
}

export const SanityIcon = memo(function SanityIconUnmemorized({
  icon,
  className,
  ...props
}: IconProps) {
  if (!icon) {
    return null;
  }

  return (
    <DynamicIcon
      {...props}
      name={icon as IconName}
      className={cn("size-12", className)}
      fallback={() => <TriangleAlert size={24} />}
      size={24}
    />
  );

  // return (
  //   <span
  //     {...props}
  //     className={cn(
  //       "sanity-icon flex size-12 items-center justify-center",
  //       className
  //     )}
  //     // biome-ignore lint/security/noDangerouslySetInnerHtml: safe SVG from CMS
  //     dangerouslySetInnerHTML={{ __html: svg }}
  //     title={alt}
  //   />
  // );
});
