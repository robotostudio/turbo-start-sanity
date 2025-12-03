import { TriangleAlert } from "lucide-react";
import { DynamicIcon, type dynamicIconImports } from "lucide-react/dynamic";

export const lucideIconPreview = (icon: keyof typeof dynamicIconImports) => {
  return (
    <DynamicIcon
      name={icon}
      fallback={() => <TriangleAlert size={24} />}
      size={24}
    />
  );
};
