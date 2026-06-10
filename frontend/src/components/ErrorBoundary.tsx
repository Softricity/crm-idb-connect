"use client";

import { Component, ReactNode } from "react";
import { Button } from "@heroui/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-danger/20 bg-danger/5 p-6">
          <h3 className="text-base font-semibold">Something went wrong</h3>
          <p className="text-sm text-foreground-500">
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </p>
          <Button size="sm" color="primary" onPress={this.handleReset}>
            Reload section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
