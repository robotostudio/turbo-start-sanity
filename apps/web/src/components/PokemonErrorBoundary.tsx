// apps/web/src/components/PokemonErrorBoundary.tsx
"use client";
import React from "react";

interface PokemonErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PokemonErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class PokemonErrorBoundary extends React.Component<
  PokemonErrorBoundaryProps,
  PokemonErrorBoundaryState
> {
  constructor(props: PokemonErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PokemonErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Pokemon component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-red-800 font-medium">
              Unable to load Pokemon data
            </p>
            <p className="text-red-600 text-sm mt-1">
              There was an error displaying the Pokemon information.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
