import {
  Component,
  type ErrorInfo,
  type ReactNode
} from "react";
import type { SceneRenderMode } from "./element-renderer";

export type ComponentExportCapability = "html" | "svg" | "png" | "pdf" | "pptx";

export interface ComponentHostElement {
  id: string;
  name: string;
  content: {
    componentId: string;
    version: string;
    props: Record<string, unknown>;
  };
  accessibility: {
    label?: string;
    description?: string;
  };
}

export interface ComponentHostDefinition<Props = unknown> {
  id: string;
  version: string;
  parseProps(input: unknown): Props;
  render(context: { props: Props; mode: SceneRenderMode }): ReactNode;
  accessibleSummary(props: Props): string;
  exportCapabilities: readonly ComponentExportCapability[];
}

const visuallyHiddenStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
} as const;

function fallbackSummary(element: ComponentHostElement): string {
  return element.accessibility.label ?? element.accessibility.description ?? element.name;
}

function ComponentFallback({
  element,
  status,
  summary
}: {
  element: ComponentHostElement;
  status: "missing" | "invalid-props" | "render-error" | "export-unsupported";
  summary: string;
}) {
  return (
    <div
      data-component-host={element.id}
      data-component-status={status}
      role="group"
      aria-label={summary}
    >
      <strong>{summary}</strong>
      <small>{element.content.componentId}@{element.content.version}</small>
    </div>
  );
}

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface BoundaryState {
  failed: boolean;
}

export class TrustedComponentErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function TrustedComponentHost<Props>({
  element,
  definition,
  mode,
  exportTarget
}: {
  element: ComponentHostElement;
  definition?: ComponentHostDefinition<Props>;
  mode: SceneRenderMode;
  exportTarget?: ComponentExportCapability;
}) {
  const baseSummary = fallbackSummary(element);
  if (!definition || definition.id !== element.content.componentId || definition.version !== element.content.version) {
    return <ComponentFallback element={element} status="missing" summary={baseSummary} />;
  }

  if (mode === "export" && exportTarget && !definition.exportCapabilities.includes(exportTarget)) {
    return <ComponentFallback element={element} status="export-unsupported" summary={baseSummary} />;
  }

  let props: Props;
  try {
    props = definition.parseProps(element.content.props);
  } catch {
    return <ComponentFallback element={element} status="invalid-props" summary={baseSummary} />;
  }

  let summary: string;
  try {
    summary = definition.accessibleSummary(props).trim();
    if (!summary) throw new Error("empty accessible summary");
  } catch {
    return <ComponentFallback element={element} status="render-error" summary={baseSummary} />;
  }

  const errorFallback = <ComponentFallback element={element} status="render-error" summary={summary} />;
  let output: ReactNode;
  try {
    output = definition.render({ props, mode });
  } catch {
    return errorFallback;
  }

  const summaryId = `${element.id}-component-summary`;
  return (
    <div
      data-component-host={element.id}
      data-component-status="ready"
      role="group"
      aria-label={summary}
      aria-describedby={summaryId}
    >
      <span id={summaryId} data-component-accessible-summary="true" style={visuallyHiddenStyle}>{summary}</span>
      <TrustedComponentErrorBoundary fallback={errorFallback}>
        {output}
      </TrustedComponentErrorBoundary>
    </div>
  );
}
