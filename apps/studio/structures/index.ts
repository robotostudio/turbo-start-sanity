import { swedbankEnStructure } from "./swedbank-en";
import { swedbankSvStructure } from "./swedbank-sv";
import { swedbankBalticStructure } from "./swedbank-baltic";
import { sparebankenSkaneStructure } from "./sparebanken-skane";

export const workspaceStructures = {
  "swedbank-en": swedbankEnStructure,
  "swedbank-sv": swedbankSvStructure,
  "swedbank-baltic": swedbankBalticStructure,
  "sparebanken-skane": sparebankenSkaneStructure,
};

// Get structure for a specific workspace
export const getWorkspaceStructure = (workspaceName: string) => {
  return (
    workspaceStructures[workspaceName as keyof typeof workspaceStructures] ||
    null
  );
};
