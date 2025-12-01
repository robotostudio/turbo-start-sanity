import { cn } from "@workspace/ui/lib/utils";
import React from "react";
import LayoutDebugHUD from "./LayoutDebugHUD";

export interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number;
  minColumns?: number;
  maxColumns?: number;
  gap?: number;
  showDebug?: boolean;
}

const GridLayout: React.FC<GridLayoutProps> = React.memo(({ 
  children, 
  columns,
  minColumns = 4,
  maxColumns = 9,
  gap = 1,
  showDebug = false,
}) => {
  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;

  // Auto-calculate columns if not provided
  // Optimize to make the last row as close as possible to the row above it
  const calculatedColumns = React.useMemo(() => {
    if (columns !== undefined) {
      return columns;
    }

    if (childCount === 0) return 4;

    // Try different column counts and find the one that minimizes
    // the difference between the last row and the full rows above it
    let bestColumns = Math.ceil(Math.sqrt(childCount)); // Start with sqrt heuristic
    let bestDifference = Infinity;

    for (let cols = minColumns; cols <= maxColumns; cols++) {
      const itemsInLastRow = childCount % cols;
      
      // If last row is empty (perfect division), this is ideal
      if (itemsInLastRow === 0) {
        bestColumns = cols;
        break;
      }
      
      // Calculate difference between last row and full rows
      const difference = Math.abs(cols - itemsInLastRow);
      
      // Prefer solutions where last row is closer to full row size
      if (difference < bestDifference) {
        bestDifference = difference;
        bestColumns = cols;
      }
    }

    return Math.max(minColumns, Math.min(maxColumns, bestColumns));
  }, [childCount, columns, minColumns, maxColumns]);

  const totalRows = Math.ceil(childCount / calculatedColumns);
  const itemsPerRow = calculatedColumns;

  return (
    <>
      {showDebug && (
        <LayoutDebugHUD
          title="Grid Layout"
          props={{
            columns: columns ?? "auto",
            gap,
          }}
          calculated={{
            childrenCount: childCount,
            calculatedColumns,
            totalRows,
            itemsPerRow,
            itemsInLastRow: childCount % calculatedColumns || calculatedColumns,
          }}
        />
      )}
      <div
        className={cn("w-full grid")}
        style={{
          gridTemplateColumns: `repeat(${calculatedColumns}, 1fr)`,
          gap: `${gap}rem`,
        }}
      >
        {React.Children.map(children, (child) => {
          return child;
        })}
      </div>
    </>
  );
});

GridLayout.displayName = "GridLayout";

export default GridLayout;
