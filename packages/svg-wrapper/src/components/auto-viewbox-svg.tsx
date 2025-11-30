"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type AutoViewBoxSvgProps = {
  children: React.ReactElement<SVGSVGElement>;
  padding?: number;
  className?: string;
};

/**
 * SVG wrapper component that automatically calculates and sets the viewBox
 * based on the bounding box of the SVG's content.
 *
 * @param children - A single SVG element whose viewBox will be calculated
 * @param padding - Optional padding to add around the content (default: 0)
 * @param className - Optional CSS class name
 */
export function AutoViewBoxSvg({
  children,
  padding = 0,
  className,
}: AutoViewBoxSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<string>("0 0 1 1");

  const calculateViewBox = useCallback(
    (svg: SVGSVGElement) => {
      // Get all path elements within the SVG
      const paths = svg.querySelectorAll("path");
      const rects = svg.querySelectorAll("rect");
      const circles = svg.querySelectorAll("circle");
      const ellipses = svg.querySelectorAll("ellipse");
      const lines = svg.querySelectorAll("line");
      const polylines = svg.querySelectorAll("polyline");
      const polygons = svg.querySelectorAll("polygon");

      // Collect all elements that have bounding boxes
      const elements: (
        | SVGPathElement
        | SVGRectElement
        | SVGCircleElement
        | SVGEllipseElement
        | SVGLineElement
        | SVGPolylineElement
        | SVGPolygonElement
      )[] = [
        ...Array.from(paths),
        ...Array.from(rects),
        ...Array.from(circles),
        ...Array.from(ellipses),
        ...Array.from(lines),
        ...Array.from(polylines),
        ...Array.from(polygons),
      ];

      if (elements.length === 0) {
        return;
      }

      // Calculate the combined bounding box
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const element of elements) {
        try {
          const bbox = element.getBBox();
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        } catch {
          // Some elements might not have a valid bounding box
          // Skip them silently
        }
      }

      // If we found valid bounds, set the viewBox
      if (
        Number.isFinite(minX) &&
        Number.isFinite(minY) &&
        Number.isFinite(maxX) &&
        Number.isFinite(maxY)
      ) {
        const width = maxX - minX;
        const height = maxY - minY;

        setViewBox(
          `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`
        );
      }
    },
    [padding]
  );

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    // Use requestAnimationFrame to ensure the SVG is fully rendered
    const frameId = requestAnimationFrame(() => {
      if (svgRef.current) {
        calculateViewBox(svgRef.current);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [calculateViewBox]);

  // Clone the SVG element and add our ref and viewBox
  const svgElement = children;
  const clonedSvg = React.cloneElement(svgElement, {
    ref: (node: SVGSVGElement | null) => {
      svgRef.current = node;
    },
    viewBox,
    className: className ?? svgElement.props.className,
  } as Record<string, unknown>);

  return clonedSvg;
}
