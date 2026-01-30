import { cn } from "@workspace/ui/lib/utils";
import * as LucideIcons from "lucide-react";
import type { ComponentProps } from "react";
import { memo } from "react";

type IconValue = string | null | undefined | Record<string, unknown>;

interface IconProps extends Omit<ComponentProps<"svg">, "src"> {
  icon?: IconValue;
  alt?: string; // Add alt text prop for accessibility
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function getIconName(icon: IconValue): string | null {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return icon;
  }
  if (typeof icon === 'object') {
    // Try common property names
    const possibleProps = ['name', 'icon', 'value', '_ref'];
    for (const prop of possibleProps) {
      if (icon[prop] && typeof icon[prop] === 'string') {
        return icon[prop];
      }
    }
  }

  return null;
}

export const SanityIcon = memo(function SanityIconUnmemorized({
  icon,
  className,
  alt,
  ...props
}: IconProps) {
  const iconString = getIconName(icon);

  if (!iconString) {
    return null;
  }

  const iconName = kebabToPascal(iconString);
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<LucideIcons.LucideProps>>)[iconName];

  if (!IconComponent || typeof IconComponent !== 'function') {
    return <LucideIcons.TriangleAlert className={cn("flex size-12 items-center justify-center", className)} size={24} />;
  }

  return (
    <IconComponent
      {...props}
      className={cn("flex size-12 items-center justify-center", className)}
      size={24}
    />
  );
});
