import type { LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Convert kebab-case to PascalCase for lucide icon names
function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export const lucideIconPreview = (icon: string) => {
  const iconName = kebabToPascal(icon);

  // Get the icon component from lucide-react
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>
  )[iconName];

  // If icon not found, show fallback
  if (!IconComponent || typeof IconComponent !== "function") {
    return <LucideIcons.TriangleAlert size={24} />;
  }

  return <IconComponent size={24} />;
};
