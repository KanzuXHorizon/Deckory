import type {
  ComponentExportCapability,
  ComponentHostDefinition
} from "./component-host";
import type { CompiledWebBlockBundle } from "./web-block-host";

export interface SceneRendererExtensions {
  components?: {
    resolve(input: {
      componentId: string;
      version: string;
    }): ComponentHostDefinition<unknown> | undefined;
  };
  webBlocks?: {
    resolve(input: {
      elementId: string;
      manifest: Record<string, unknown>;
      sourceId?: string;
    }): {
      bundle?: CompiledWebBlockBundle;
      fallbackSrc?: string;
    } | undefined;
  };
  exportTarget?: ComponentExportCapability;
}
