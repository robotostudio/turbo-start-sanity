"use client";

import type React from "react";
import {useMemo} from "react";

type GlyphBoxProps = {
  char: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  className?: string;
  style?: React.CSSProperties;
};

type Metrics = {
  width: number;
  height: number;
  left: number;
  ascent: number;
};

function toFontString(opts: {
  fontStyle?: "normal" | "italic";
  fontWeight?: number | string;
  fontSize?: number | string;
  fontFamily?: string;
}): string {
  const style = opts.fontStyle ?? "normal";
  const weight = opts.fontWeight ?? "normal";
  const size =
    typeof opts.fontSize === "number"
      ? `${opts.fontSize}px`
      : opts.fontSize ?? "16px";
  const family = opts.fontFamily ?? "inherit";
  return `${style} ${weight} ${size} ${family}`;
}

function measureGlyph(char: string, font: string): Metrics | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  // Set textBaseline so ascent/descent align with metrics
  ctx.textBaseline = "alphabetic";
  const mt = ctx.measureText(char);
  const hasActual =
    mt.actualBoundingBoxLeft !== undefined &&
    mt.actualBoundingBoxRight !== undefined &&
    mt.actualBoundingBoxAscent !== undefined &&
    mt.actualBoundingBoxDescent !== undefined;

  if (!hasActual) {
    // Fallback: approximate using font size when actual metrics aren't available
    const approxSize = (() => {
      const match = /\b(\d+(?:\.\d+)?)px\b/.exec(font);
      // biome-ignore lint/style/noMagicNumbers: magic
      // @ts-expect-error
      return match ? parseFloat(match[1]) : 16;
    })();
    // Approximate width using advance width (mt.width) if available
    const w = Math.max(mt.width || approxSize, 1);
    return {
      width: w,
      height: approxSize,
      left: 0,
      ascent: approxSize * 0.8,
    };
  }

  const width = mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight;
  const height = mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent;
  return {
    width,
    height,
    left: mt.actualBoundingBoxLeft,
    ascent: mt.actualBoundingBoxAscent,
  };
}

export function GlyphBox({
  char,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  className,
  style,
}: GlyphBoxProps) {
  const font = useMemo(
    () => toFontString({fontFamily, fontSize, fontWeight, fontStyle}),
    [fontFamily, fontSize, fontWeight, fontStyle]
  );

  const metrics = useMemo(() => measureGlyph(char, font), [char, font]);

  // If metrics aren't available yet (SSR), render nothing to avoid hydration mismatch
  if (!metrics) return null;

  const {width, height, left, ascent} = metrics;

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: special case
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        display: "inline-block",
        // Center transforms on the glyph's tight bounding box
        transformOrigin: "center",
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x={left}
        y={ascent}
        // Ensure transforms on <text> also respect the ink box
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
          // These SVG-specific properties make transform origin align to the glyph box
          transformBox: "fill-box" as any,
          transformOrigin: "center",
        }}
      >
        {char}
      </text>
    </svg>
  );
}
