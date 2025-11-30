import type { LucideIcon as LucideIconType } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconSize = "sm" | "md" | "lg" | number;

const SIZE_MAP: Record<"sm" | "md" | "lg", number> = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

/**
 * Gets the numeric size value from a size parameter.
 */
function getSizeValue(size: IconSize): number {
  return typeof size === "number" ? size : SIZE_MAP[size];
}

/**
 * Wraps a Sanity icon component with size control.
 * Sanity icons are React components that accept SVGProps.
 *
 * @example
 * ```tsx
 * import { DocumentIcon } from "@sanity/icons";
 * const SizedIcon = withIconSize(DocumentIcon, "md");
 * // Use in schema: icon: SizedIcon
 * ```
 */
export function withIconSize<T extends ComponentType<SVGProps<SVGSVGElement>>>(
  Icon: T,
  size: IconSize = "md"
): ComponentType<SVGProps<SVGSVGElement>> {
  const sizeValue = getSizeValue(size);
  
  const WrappedIcon = (props: SVGProps<SVGSVGElement>) => {
    // biome-ignore lint/suspicious/noExplicitAny: Icon component type is complex, using any for flexibility
    const IconComponent = Icon as any;
    return (
      <IconComponent
        {...props}
        style={{
          width: `${sizeValue}px`,
          height: `${sizeValue}px`,
          ...props.style,
          strokeWidth: 1.5,
        }}
      />
    );
  };

  return WrappedIcon;
}

/**
 * Wraps a Lucide React icon component with size control.
 * Lucide icons accept a `size` prop and SVGProps.
 *
 * @example
 * ```tsx
 * import { FileText } from "lucide-react";
 * const SizedIcon = withLucideIconSize(FileText, "md");
 * // Use in schema: icon: SizedIcon
 * ```
 */
export function withLucideIconSize(
  Icon: LucideIconType,
  size: IconSize = "md"
): LucideIconType {
  const sizeValue = getSizeValue(size);
  
  const WrappedIcon = (props: SVGProps<SVGSVGElement>) => (
    <Icon
      {...props}
      size={sizeValue}
      style={{
        width: `${sizeValue}px`,
        height: `${sizeValue}px`,
        ...props.style,
      }}
    />
  );

  return WrappedIcon as LucideIconType;
}

/**
 * Convenience function to create a consistently sized icon for schema definitions.
 * Works with both @sanity/icons and lucide-react icons.
 * Defaults to "md" (16px) to match @sanity/icons standard size.
 *
 * @example
 * ```tsx
 * import { DocumentIcon } from "@sanity/icons";
 * import { FileText } from "lucide-react";
 *
 * // Sanity icon
 * icon: schemaIcon(DocumentIcon)
 *
 * // Lucide icon
 * icon: schemaIcon(FileText)
 *
 * // Custom size
 * icon: schemaIcon(FileText, "lg")
 * icon: schemaIcon(FileText, 18)
 * ```
 */
export function schemaIcon(
  Icon: ComponentType<SVGProps<SVGSVGElement>>,
  size: IconSize = "md"
  // thinner lines
 
): ComponentType<SVGProps<SVGSVGElement>> {
  return withIconSize(Icon, size);
}

