import { useCallback, useState } from "react";

interface UseTreeExpansionReturn {
  expanded: Set<string>;
  isExpanded: (path: string) => boolean;
  toggleExpansion: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setExpanded: (paths: string[]) => void;
}

export const useTreeExpansion = (
  initialExpanded: string[] = ["/"],
): UseTreeExpansionReturn => {
  const [expanded, setExpandedState] = useState<Set<string>>(
    new Set(initialExpanded),
  );

  const isExpanded = useCallback(
    (path: string): boolean => expanded.has(path),
    [expanded],
  );

  const toggleExpansion = useCallback((path: string) => {
    setExpandedState((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  }, []);

  const expandAll = useCallback(() => {
    // This would need access to all possible paths
    // Implementation depends on use case
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedState(new Set());
  }, []);

  const setExpanded = useCallback((paths: string[]) => {
    setExpandedState(new Set(paths));
  }, []);

  return {
    expanded,
    isExpanded,
    toggleExpansion,
    expandAll,
    collapseAll,
    setExpanded,
  };
};
