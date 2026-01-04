import { cn } from "@repo/ui/lib/utils";
import type { LucideIcon as LucideIconType } from "lucide-react";
import type { ComponentProps } from "react";
import { memo } from "react";

type LucideIconProps = Omit<ComponentProps<LucideIconType>, "size"> & {
  icon: LucideIconType;
  className?: string;
};

/**
 * Wrapper component for lucide-react icons that ensures consistent sizing
 * to match @sanity/icons (size-4 / 16px by default).
 *
 * @example
 * ```tsx
 * import { ChevronDown } from "lucide-react";
 * <LucideIcon icon={ChevronDown} className="transition-transform" />
 * ```
 */
export const LucideIcon = memo(function LucideIconComponent({
  icon: Icon,
  className,
  ...props
}: LucideIconProps) {
  return (
    <Icon
      className={cn("size-4", className)}
      {...props}
    />
  );
});

