import DOMPurify from "isomorphic-dompurify";
import { DynamicIcon } from "lucide-react/dynamic";
import type { ComponentProps } from "react";
import { memo } from "react";

interface IconProps extends Omit<ComponentProps<"svg">, "src"> {
  icon?: string | null | IconData;
  alt?: string;
  size?: number;
}

interface IconData {
  _type: string;
  name: string;
  provider?: string;
  svg?: string;
}

// Convert kebab-case to kebab-case (DynamicIcon expects kebab-case names)
function normalizeIconName(str: string): string {
  // Ensure it's in kebab-case format
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export const SanityIcon = memo(function SanityIconUnmemorized({
  icon,
  className,
  size = 24,
  ...props
}: IconProps) {
  if (!icon) {
    return null;
  }

  // Handle old iconPicker format with SVG string
  if (typeof icon === "object" && icon !== null) {
    const iconObj = icon as IconData;

    // If SVG string is provided, sanitize and use it
    if (iconObj.svg) {
      // Sanitize the SVG using DOMPurify with SVG profile to remove malicious content
      const safeSvg = DOMPurify.sanitize(iconObj.svg, {
        USE_PROFILES: { svg: true },
      });

      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: safeSvg }}
          style={{
            fontSize: size,
            lineHeight: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      );
    }

    // For lucide-icon format, extract the name
    const iconName = normalizeIconName(iconObj.name);
    return (
      <DynamicIcon
        name={iconName}
        size={size}
        {...props}
        className={className}
      />
    );
  }

  // Handle string format (lucide-icon)
  if (typeof icon === "string") {
    const iconName = normalizeIconName(icon);
    return (
      <DynamicIcon
        name={iconName}
        size={size}
        {...props}
        className={className}
      />
    );
  }

  // Final fallback
  return (
    <DynamicIcon
      name="triangle-alert"
      size={size}
      {...props}
      className={className}
    />
  );
});
