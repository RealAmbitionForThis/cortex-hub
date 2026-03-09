'use client';

import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {this.state.error?.message || 'An unexpected error occurred'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => this.setState({ hasError: false, error: null })}
        >
          Try again
        </Button>
      </div>
    );
  }
}
