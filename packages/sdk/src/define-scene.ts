import {
  DeckDocumentV2Schema,
  SceneSlideSchema,
  type DeckAssetV2,
  type DeckDataSource,
  type DeckDocumentV2,
  type DeckThemeV2,
  type SceneElement,
  type SceneSlide,
  type SlideMasterV2
} from "@deckory/schema/v2";
import type { SceneNodeDescription, SceneSlideDescription } from "./jsx-runtime";

export interface DefineSceneSlideMetadata {
  id: string;
  name: string;
  purpose?: string;
  conclusion?: string;
  masterId?: string;
  notes?: string;
}

export interface DefineSceneDeckMetadata {
  id: string;
  title: string;
  locale: "vi-VN" | "en-US";
  theme: DeckThemeV2;
  revision?: number;
  assets?: readonly DeckAssetV2[];
  dataSources?: readonly DeckDataSource[];
  masters?: readonly SlideMasterV2[];
  componentPackages?: readonly { id: string; version: string; integrity?: string }[];
}

function freezeDeep<T>(value: T, seen = new Set<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child, seen);
  return Object.freeze(value);
}

function requireSlideNode(value: SceneNodeDescription): SceneSlideDescription {
  if (value.nodeType !== "slide") {
    throw new TypeError("defineSceneSlide yêu cầu factory trả về đúng một primitive Slide.");
  }
  return value;
}

function flattenElements(
  nodes: readonly SceneNodeDescription[],
  parentId: string | undefined,
  output: Record<string, unknown>[],
  ids: Set<string>
): void {
  for (const node of nodes) {
    if (node.nodeType === "text") {
      throw new TypeError("Text thô không được phép ngoài primitive Text.");
    }
    if (node.nodeType === "slide") {
      throw new TypeError("Slide không thể được lồng bên trong một phần tử scene.");
    }
    if (node.nodeType === "fragment") {
      flattenElements(node.children, parentId, output, ids);
      continue;
    }

    const id = node.element.id;
    if (typeof id !== "string" || id.length === 0) {
      throw new TypeError("Mỗi Scene JSX element phải có id hợp lệ.");
    }
    if (ids.has(id)) {
      throw new TypeError(`ID phần tử "${id}" bị trùng trong slide.`);
    }
    ids.add(id);

    const element = {
      ...node.element,
      ...(parentId ? { parentId } : {})
    };
    output.push(element);
    flattenElements(node.children, id, output, ids);
  }
}

export function defineSceneSlide(
  metadata: DefineSceneSlideMetadata,
  factory: () => SceneNodeDescription
): SceneSlide {
  const sceneNode = requireSlideNode(factory());
  const elements: Record<string, unknown>[] = [];
  flattenElements(sceneNode.children, undefined, elements, new Set<string>());

  const candidate = {
    id: metadata.id,
    name: metadata.name,
    ...sceneNode.slide,
    ...(metadata.purpose ? { purpose: metadata.purpose } : {}),
    ...(metadata.conclusion ? { conclusion: metadata.conclusion } : {}),
    ...(metadata.masterId ? { masterId: metadata.masterId } : {}),
    ...(metadata.notes ? { notes: metadata.notes } : {}),
    elements
  };

  return freezeDeep(SceneSlideSchema.parse(candidate));
}

export function defineSceneDeck(
  metadata: DefineSceneDeckMetadata,
  slides: readonly SceneSlide[]
): DeckDocumentV2 {
  const candidate = {
    schemaVersion: 2 as const,
    id: metadata.id,
    revision: metadata.revision ?? 0,
    title: metadata.title,
    locale: metadata.locale,
    canvas: { width: 1280 as const, height: 720 as const, unit: "px" as const },
    theme: metadata.theme,
    assets: [...(metadata.assets ?? [])],
    ...(metadata.dataSources ? { dataSources: [...metadata.dataSources] } : {}),
    ...(metadata.masters ? { masters: [...metadata.masters] } : {}),
    ...(metadata.componentPackages ? { componentPackages: [...metadata.componentPackages] } : {}),
    slides: [...slides]
  };
  return freezeDeep(DeckDocumentV2Schema.parse(candidate));
}

export function isSceneElement(value: unknown): value is SceneElement {
  return typeof value === "object" && value !== null && "kind" in value && "frame" in value;
}
