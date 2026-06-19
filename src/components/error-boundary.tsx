import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode; title?: string; onReset?: () => void };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { console.error("[ErrorBoundary]", error); }
  reset = () => { this.props.onReset?.(); this.setState({ error: null }); };
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <h3 className="mt-3 font-display text-lg font-bold">{this.props.title || "حدث خطأ غير متوقع"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error.message || "تعذّر إكمال العملية. حاول مرة أخرى."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={this.reset}>إعادة المحاولة</Button>
        </div>
      );
    }
    return this.props.children;
  }
}