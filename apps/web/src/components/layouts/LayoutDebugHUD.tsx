import { cn } from "@workspace/ui/lib/utils";
import type React from "react";

interface LayoutDebugHUDProps {
  title: string;
  props: Record<string, unknown>;
  calculated: Record<string, unknown>;
  className?: string;
}

const LayoutDebugHUD: React.FC<LayoutDebugHUDProps> = ({
  title,
  props,
  calculated,
  className,
}) => {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 rounded-lg border bg-background/95 p-4 text-xs shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-2 font-semibold text-sm">{title}</div>
      <div className="space-y-1">
        <div>
          <span className="font-medium text-muted-foreground">Props:</span>
          <div className="ml-2 mt-1 space-y-0.5">
            {Object.entries(props).map(([key, value]) => (
              <div key={key} className="font-mono">
                <span className="text-muted-foreground">{key}:</span>{" "}
                <span className="text-foreground">
                  {value === undefined ? "undefined" : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 border-t pt-2">
          <span className="font-medium text-muted-foreground">Calculated:</span>
          <div className="ml-2 mt-1 space-y-0.5">
            {Object.entries(calculated).map(([key, value]) => (
              <div key={key} className="font-mono">
                <span className="text-muted-foreground">{key}:</span>{" "}
                <span className="text-foreground">
                  {value === undefined ? "undefined" : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutDebugHUD;
