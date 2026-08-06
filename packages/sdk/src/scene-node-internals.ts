import type {
  SceneNodeDescription,
  ScenePrimitive
} from "./jsx-runtime";

const approvedSceneNodes = new WeakSet<object>();

export function freezeSceneValue<T>(value: T, seen = new Set<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) {
    freezeSceneValue(child, seen);
  }
  return Object.freeze(value);
}

export function approveSceneNode<T extends SceneNodeDescription>(node: T): T {
  approvedSceneNodes.add(node as object);
  return node;
}

export function isApprovedSceneNode(value: unknown): value is SceneNodeDescription {
  return typeof value === "object" && value !== null && approvedSceneNodes.has(value);
}

export function createScenePrimitive<Props>(
  primitiveName: string,
  factory: (props: Props) => SceneNodeDescription
): ScenePrimitive<Props> {
  const primitive = ((props: Props) => {
    const node = freezeSceneValue(factory(props));
    return approveSceneNode(node);
  }) as ScenePrimitive<Props>;
  Object.defineProperties(primitive, {
    __deckoryScenePrimitive: { value: true, enumerable: false },
    primitiveName: { value: primitiveName, enumerable: false }
  });
  return Object.freeze(primitive);
}
