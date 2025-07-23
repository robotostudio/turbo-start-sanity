"use client";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

/**
 * InteractiveGridPattern is a component that renders a grid pattern with interactive squares.
 *
 * @param width - The width of each square.
 * @param height - The height of each square.
 * @param squares - The number of squares in the grid. The first element is the number of horizontal squares, and the second element is the number of vertical squares.
 * @param className - The class name of the grid.
 * @param squaresClassName - The class name of the squares.
 */
interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  squares?: [number, number]; // [horizontal, vertical]
  className?: string;
  squaresClassName?: string;
}

/**
 * The InteractiveGridPattern component.
 *
 * @see InteractiveGridPatternProps for the props interface.
 * @returns A React component.
 */
export function InteractiveGridPattern({
  width = 20,
  height = 20,
  squares = [56, 56],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares;
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg
      width={width * horizontal}
      height={height * vertical}
      className={cn(
        "absolute inset-0 h-full w-full border border-gray-400/30",
        className,
      )}
      {...props}
    >
      {Array.from({ length: horizontal * vertical }).map((_, index) => {
        const x = (index % horizontal) * width;
        const y = Math.floor(index / horizontal) * height;
        return (
          <g
            key={`interactive-grid-pattern-${index.toString()}`}
            onMouseEnter={() => setHoveredSquare(index)}
            onMouseLeave={() => setHoveredSquare(null)}
          >
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              className={cn(
                "stroke-gray-400/30 transition-all duration-100 ease-in-out not-[&:hover]:duration-1000",
                hoveredSquare === index
                  ? "fill-gray-300/30"
                  : "fill-transparent",
                squaresClassName,
              )}
            />
            <rect x={x} y={y} width="1" height="1" className="fill-gray-600" />{" "}
            {/* Top Left */}
            <rect
              x={x + width - 1}
              y={y}
              width="1"
              height="1"
              className="fill-gray-600"
            />{" "}
            {/* Top Right */}
            <rect
              x={x}
              y={y + height - 1}
              width="1"
              height="1"
              className="fill-gray-600"
            />{" "}
            {/* Bottom Left */}
            <rect
              x={x + width - 1}
              y={y + height - 1}
              width="1"
              height="1"
              className="fill-gray-600"
            />{" "}
            {/* Bottom Right */}
          </g>
        );
      })}
    </svg>
  );
}
