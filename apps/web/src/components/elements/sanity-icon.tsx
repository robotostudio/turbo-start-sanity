import type { LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { ComponentProps } from 'react';
import { memo } from 'react';

interface IconProps extends Omit<ComponentProps<'svg'>, 'src'> {
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

// Convert kebab-case to PascalCase for lucide icon names
function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
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
  if (typeof icon === 'object' && icon !== null) {
    const iconObj = icon as IconData;

    // If SVG string is provided, use it directly
    if (iconObj.svg) {
      // Remove only inline styles, keep width/height attributes but override with fontSize
      const cleanSvg = iconObj.svg.replaceAll(/style="[^"]*"/g, '');

      return (
        <span
          className={className}
          dangerouslySetInnerHTML={{ __html: cleanSvg }}
          style={{
            fontSize: size,
            lineHeight: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      );
    }

    // For lucide-icon format, extract the name
    const iconName = kebabToPascal(iconObj.name);
    const IconComponent = (
      LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>
    )[iconName];

    if (IconComponent && typeof IconComponent === 'function') {
      return <IconComponent {...props} className={className} size={size} />;
    }

    // Fallback
    return <LucideIcons.TriangleAlert className={className} size={size} />;
  }

  // Handle string format (lucide-icon)
  if (typeof icon === 'string') {
    const iconName = kebabToPascal(icon);
    const IconComponent = (
      LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>
    )[iconName];

    if (IconComponent && typeof IconComponent === 'function') {
      return <IconComponent {...props} className={className} size={size} />;
    }
  }

  // Final fallback
  return <LucideIcons.TriangleAlert className={className} size={size} />;
});
