import { Component, type ReactNode } from "react";
import { MathRenderer } from "@/components/math/MathRenderer";

/**
 * Render LaTeX content via MathRenderer, but never let a KaTeX/parser
 * exception break the whole review screen. Falls back to plain text.
 */
interface State {
  hasError: boolean;
}
interface Props {
  content: string;
  inline?: boolean;
  fallback?: ReactNode;
}

export class SafeMath extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[REVIEW] SafeMath render failed", error);
  }

  render() {
    const { content, inline, fallback } = this.props;
    if (this.state.hasError) {
      return (
        <span className="whitespace-pre-wrap break-words text-foreground/80">
          {fallback ?? content}
        </span>
      );
    }
    return <MathRenderer content={content} inline={inline} />;
  }
}
