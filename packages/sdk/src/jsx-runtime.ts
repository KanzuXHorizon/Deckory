export type SceneTextDescription = Readonly<{
  nodeType: "text";
  value: string;
}>;

export type SceneFragmentDescription = Readonly<{
  nodeType: "fragment";
  children: readonly SceneNodeDescription[];
}>;

export type SceneElementDescription = Readonly<{
  nodeType: "element";
  element: Readonly<Record<string, unknown>>;
  children: readonly SceneNodeDescription[];
}>;

export type SceneSlideDescription = Readonly<{
  nodeType: "slide";
  slide: Readonly<Record<string, unknown>>;
  children: readonly SceneNodeDescription[];
}>;

export type SceneNodeDescription =
  | SceneTextDescription
  | SceneFragmentDescription
  | SceneElementDescription
  | SceneSlideDescription;

export type ScenePrimitive<Props = Record<string, unknown>> = ((props: Props) => SceneNodeDescription) & Readonly<{
  __deckoryScenePrimitive: true;
  primitiveName: string;
}>;

export const Fragment = Symbol.for("@deckory/sdk/Fragment");

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertSerializable(value: unknown, path: string, seen: Set<object>): void {
  if (value === null || value === undefined) return;

  const valueType = typeof value;
  if (valueType === "function") {
    throw new TypeError(`Giá trị function tại ${path} không thể tuần tự thành Deckory scene node.`);
  }
  if (valueType === "symbol" || valueType === "bigint") {
    throw new TypeError(`Giá trị ${valueType} tại ${path} không thể tuần tự thành Deckory scene node.`);
  }
  if (valueType === "number" && !Number.isFinite(value as number)) {
    throw new TypeError(`Giá trị số tại ${path} phải hữu hạn.`);
  }
  if (valueType !== "object") return;

  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new TypeError(`Dữ liệu tại ${path} chứa tham chiếu vòng và không thể tuần tự.`);
  }
  seen.add(objectValue);

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSerializable(item, `${path}[${index}]`, seen));
    seen.delete(objectValue);
    return;
  }

  if (!isPlainObject(objectValue)) {
    throw new TypeError(`Đối tượng tại ${path} phải là dữ liệu thuần có thể tuần tự.`);
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/^on[a-z]/i.test(key) && child !== undefined) {
      throw new TypeError(`Thuộc tính thực thi ${key} không được phép trong Scene JSX.`);
    }
    assertSerializable(child, `${path}.${key}`, seen);
  }
  seen.delete(objectValue);
}

function freezeDeep<T>(value: T, seen = new Set<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const objectValue = value as object;
  if (seen.has(objectValue)) return value;
  seen.add(objectValue);
  for (const child of Object.values(value as Record<string, unknown>)) {
    freezeDeep(child, seen);
  }
  return Object.freeze(value);
}

export function normalizeSceneChildren(value: unknown): readonly SceneNodeDescription[] {
  const output: SceneNodeDescription[] = [];

  const visit = (child: unknown): void => {
    if (child === null || child === undefined || child === false || child === true) return;
    if (Array.isArray(child)) {
      child.forEach(visit);
      return;
    }
    if (typeof child === "string" || typeof child === "number") {
      output.push(freezeDeep({ nodeType: "text", value: String(child) } as const));
      return;
    }
    if (typeof child === "object" && child !== null && "nodeType" in child) {
      const node = child as SceneNodeDescription;
      if (node.nodeType === "fragment") {
        node.children.forEach(visit);
      } else {
        output.push(node);
      }
      return;
    }
    throw new TypeError("Scene JSX chỉ chấp nhận primitive Deckory, chuỗi, số hoặc fragment hợp lệ.");
  };

  visit(value);
  return freezeDeep(output);
}

export function createScenePrimitive<Props>(
  primitiveName: string,
  factory: (props: Props) => SceneNodeDescription
): ScenePrimitive<Props> {
  const primitive = ((props: Props) => factory(props)) as ScenePrimitive<Props>;
  Object.defineProperties(primitive, {
    __deckoryScenePrimitive: { value: true, enumerable: false },
    primitiveName: { value: primitiveName, enumerable: false }
  });
  return Object.freeze(primitive);
}

function isScenePrimitive(value: unknown): value is ScenePrimitive<any> {
  return typeof value === "function" && (value as Partial<ScenePrimitive<any>>).__deckoryScenePrimitive === true;
}

export function jsx(
  type: ScenePrimitive<any> | typeof Fragment | string | ((props: unknown) => unknown),
  props: Record<string, unknown> | null,
  _key?: string
): SceneNodeDescription {
  const safeProps = props ?? {};
  assertSerializable(safeProps, "props", new Set<object>());

  if (typeof type === "string") {
    throw new TypeError(`Thẻ HTML intrinsic "${type}" không được hỗ trợ trong Scene JSX.`);
  }

  if (type === Fragment) {
    return freezeDeep({
      nodeType: "fragment",
      children: normalizeSceneChildren(safeProps.children)
    } as const);
  }

  if (!isScenePrimitive(type)) {
    const name = typeof type === "function" && type.name ? type.name : "anonymous";
    throw new TypeError(`Component "${name}" không phải primitive Scene JSX đã được phê duyệt.`);
  }

  const node = type(safeProps);
  assertSerializable(node, `primitive:${type.primitiveName}`, new Set<object>());
  return freezeDeep(node);
}

export const jsxs = jsx;

export namespace JSX {
  export type Element = SceneNodeDescription;
  export interface ElementChildrenAttribute {
    children: unknown;
  }
  export interface IntrinsicElements {}
}
