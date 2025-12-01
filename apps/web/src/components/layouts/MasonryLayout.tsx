import { cn } from "@workspace/ui/lib/utils";
import React from "react";
import LayoutDebugHUD from "./LayoutDebugHUD";

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface MasonryLayoutProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  showDebug?: boolean;
  imageDimensions?: ImageDimensions[];
}

const MasonryLayout: React.FC<MasonryLayoutProps> = React.memo(({ 
  children, 
  columns,
  gap = 0,
  showDebug = false,
  imageDimensions,
}) => {
  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;

  // Calculate aspect ratios from dimensions if provided
  const aspectRatios = React.useMemo(() => {
    if (!imageDimensions || imageDimensions.length === 0) {
      return null;
    }
    
    return imageDimensions.map((dim) => {
      if (dim.aspectRatio !== undefined) {
        return dim.aspectRatio;
      }
      return dim.width / dim.height;
    });
  }, [imageDimensions]);

  // Auto-calculate columns if not provided
  const calculatedColumns = React.useMemo(() => {
    // if columns are provided, use them
    if (columns !== undefined) {
      return columns;
    }

    // if no columns are provided, calculate the perfect number of columns for the given imageCount
    if (childCount === 0) return 4;

    // Simple heuristic: sqrt of child count, clamped between 2 and 7
    const calculated = Math.ceil(Math.sqrt(childCount));
    return Math.max(2, Math.min(7, calculated));
  }, [childCount, columns]);
  
  // Group children into rows using image dimensions when available
  const rows = React.useMemo(() => {
    const rows: { 
      children: React.ReactNode[]; 
      widths: number[];
    }[] = [];
    
    // If we have aspect ratios, use them for intelligent layout
    if (aspectRatios && aspectRatios.length === childCount) {
      let currentRow: React.ReactNode[] = [];
      let currentRowAspectRatios: number[] = [];
      
      childrenArray.forEach((child, index) => {
        const aspectRatio = aspectRatios[index] ?? 1;
        
        // Calculate what the total width would be if we add this image
        // In a masonry layout, if all images have height H, then:
        // - Image width = aspectRatio * H
        // - Total width = H * sum(aspectRatios)
        // - We want total width ≈ calculatedColumns (in relative units)
        const currentRowSumAspectRatios = currentRowAspectRatios.reduce((sum, ar) => sum + ar, 0);
        const newSumAspectRatios = currentRowSumAspectRatios + aspectRatio;
        
        // Estimate if adding this image would make the row too wide
        // We use calculatedColumns as a rough target for the sum of aspect ratios
        // (this assumes images will be roughly square-ish on average)
        const estimatedTotalWidth = newSumAspectRatios;
        const gapFactor = currentRow.length > 0 ? 1 + (gap * currentRow.length * 0.1) : 1;
        
        if (currentRow.length > 0 && estimatedTotalWidth * gapFactor > calculatedColumns * 1.2) {
          // Normalize widths: each image's width = its aspectRatio / sum of all aspectRatios in row
          const normalizedWidths = currentRowAspectRatios.map(ar => ar / currentRowSumAspectRatios);
          
          rows.push({ 
            children: currentRow, 
            widths: normalizedWidths,
          });
          
          // Start new row
          currentRow = [child];
          currentRowAspectRatios = [aspectRatio];
        } else {
          currentRow.push(child);
          currentRowAspectRatios.push(aspectRatio);
        }
      });
      
      // Add the last row
      if (currentRow.length > 0) {
        const totalAspectRatio = currentRowAspectRatios.reduce((sum, ar) => sum + ar, 0);
        const normalizedWidths = currentRowAspectRatios.map(ar => ar / totalAspectRatio);
        
        rows.push({ 
          children: currentRow, 
          widths: normalizedWidths,
        });
      }
    } else {
      // Fallback to simple weight-based layout when dimensions aren't available
      let currentRow: React.ReactNode[] = [];
      let currentRowWidths: number[] = [];
      
      // Base unit: 1 column worth of width
      const columnUnit = 1 / calculatedColumns;
      
      childrenArray.forEach((child, index) => {
        // Assign a "weight" to each item (1-2 column units for variety)
        const weight = index % 5 === 0 ? 2 : 1;
        const itemWidth = weight * columnUnit;
        
        // If adding this item would exceed 1.0 (100% width), start a new row
        const currentTotal = currentRowWidths.reduce((sum, w) => sum + w, 0);
        if (currentRow.length > 0 && currentTotal + itemWidth > 1.01) {
          // Normalize the current row widths to fill 100%
          const totalWeight = currentRowWidths.reduce((sum, w) => sum + w, 0);
          const normalizedWidths = currentRowWidths.map(w => w / totalWeight);
          rows.push({ children: currentRow, widths: normalizedWidths });
          currentRow = [child];
          currentRowWidths = [itemWidth];
        } else {
          currentRow.push(child);
          currentRowWidths.push(itemWidth);
        }
      });
      
      // Add the last row
      if (currentRow.length > 0) {
        const totalWeight = currentRowWidths.reduce((sum, w) => sum + w, 0);
        const normalizedWidths = currentRowWidths.map(w => w / totalWeight);
        rows.push({ children: currentRow, widths: normalizedWidths });
      }
    }
    
    return rows;
  }, [childrenArray, calculatedColumns, aspectRatios, gap, childCount]);

  // Calculate debug stats
  const rowStats = React.useMemo(() => {
    if (rows.length === 0) return null;
    
    const itemsPerRow = rows.map(row => row.children.length);
    const minItems = Math.min(...itemsPerRow);
    const maxItems = Math.max(...itemsPerRow);
    const avgItems = (childCount / rows.length).toFixed(2);
    
    return {
      minItemsPerRow: minItems,
      maxItemsPerRow: maxItems,
      avgItemsPerRow: avgItems,
      firstRowItems: rows[0]?.children.length ?? 0,
      lastRowItems: rows[rows.length - 1]?.children.length ?? 0,
    };
  }, [rows, childCount]);
  
  return (
    <>
      {showDebug && (
        <LayoutDebugHUD
          title="Masonry Layout"
          props={{
            columns: columns ?? "auto",
            gap,
          }}
          calculated={{
            childrenCount: childCount,
            calculatedColumns,
            totalRows: rows.length,
            ...(rowStats ? {
              minItemsPerRow: rowStats.minItemsPerRow,
              maxItemsPerRow: rowStats.maxItemsPerRow,
              avgItemsPerRow: rowStats.avgItemsPerRow,
              firstRowItems: rowStats.firstRowItems,
              lastRowItems: rowStats.lastRowItems,
            } : {}),
          }}
        />
      )}
      <div
        className={cn("w-full flex flex-col")}
        style={{
          gap: `${gap}rem`,
        }}
      >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="w-full flex"
          style={{
            gap: `${gap}rem`,
          }}
        >
          {row.children.map((child, itemIndex) => {
            const widthPercent = (row.widths[itemIndex] ?? 1) * 100;
            
            return (
              <div
                key={itemIndex}
                className="overflow-hidden"
                style={{
                  width: `${widthPercent}%`,
                  flexShrink: 0,
                }}
              >
                {child}
              </div>
            );
          })}
        </div>
      ))}
      </div>
    </>
  );
});

MasonryLayout.displayName = "MasonryLayout";

export default MasonryLayout;
