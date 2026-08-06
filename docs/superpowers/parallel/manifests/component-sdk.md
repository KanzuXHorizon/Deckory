# Component SDK Core Track Manifest

## Track identity

- Track: B — Component SDK Core
- Branch: `feat/v2-component-sdk-core`
- Managed worktree: `C:\Users\KanzuWakazaki\.devspace\profiles\Deckory\session-1\worktrees\Deckory-db06f7db`
- Accepted Scene Foundation base: `4425113417a1a064695525baef1af822b4be430b`
- Source checkout: `F:\Deckory`
- Source checkout changes copied into this track: none
- Merge, push, publish or tag performed: no

## Implementation commits

1. `8694c6a75cf156ac938d008e46ae6da7ad12a9fd` — `feat(sdk): add Scene JSX and custom code contracts`
2. `d4d205b279eb408392830f14b100bd84b9518f4e` — `feat(renderer): add isolated custom component hosts`

## Scope delivered

### Scene JSX runtime

Implemented a custom JSX runtime that returns immutable serializable descriptions rather than React elements.

Public contract:

```ts
export type SceneNodeDescription =
  | SceneTextDescription
  | SceneFragmentDescription
  | SceneElementDescription
  | SceneSlideDescription;

export type ScenePrimitive<Props = Record<string, unknown>> =
  ((props: Props) => SceneNodeDescription) & {
    readonly __deckoryScenePrimitive: true;
    readonly primitiveName: string;
  };

export const Fragment: unique symbol;

export function jsx(
  type: ScenePrimitive<any> | typeof Fragment | string | ((props: unknown) => unknown),
  props: Record<string, unknown> | null,
  key?: string
): SceneNodeDescription;

export const jsxs: typeof jsx;
```

Authoring boundaries:

```ts
export function defineSceneSlide(
  metadata: DefineSceneSlideMetadata,
  factory: () => SceneNodeDescription
): SceneSlide;

export function defineSceneDeck(
  metadata: DefineSceneDeckMetadata,
  slides: readonly SceneSlide[]
): DeckDocumentV2;
```

Approved primitives:

```ts
Slide
Group
Stack
Grid
Text
RichText
Image
Icon
Shape
Line
Connector
Svg
Chart
Table
Diagram
Component
WebBlock
EvidenceFooter
```

Runtime guarantees covered by tests:

- intrinsic HTML strings such as `div` and `script` are rejected;
- arbitrary capitalized functions are rejected unless marked as an approved scene primitive;
- forged scene-node objects are rejected through internal provenance tracking; the primitive factory is not exposed by package entrypoints;
- props beginning with `on`, including `onClick`, are rejected;
- function, symbol, bigint, non-finite number, circular and non-plain-object values are rejected;
- text is accepted only by text-capable primitives;
- duplicate element IDs fail before V2 document validation;
- parent hierarchy is derived deterministically from Scene JSX nesting;
- output is deeply frozen and JSON serializable;
- final slides and decks are parsed by the accepted V2 schemas;
- TypeScript exposes no `JSX.IntrinsicElements`; a compile-time fixture proves `<div>` is denied.

### Trusted component registry

Public contract:

```ts
export interface DeckComponentDefinition<
  Props = unknown,
  Schema extends z.ZodObject<any> = z.ZodObject<any>
> {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly purpose?: string;
  readonly propsSchema: Schema;
  readonly defaultFrame: Readonly<{ width: number; height: number }>;
  readonly inspector: InspectorSchema;
  readonly renderer: (context: DeckComponentRenderContext<Props>) => ReactNode;
  readonly accessibleSummary: (props: Props) => string;
  readonly exportCapabilities: readonly ExportCapability[];
  readonly migrateProps?: (context: DeckComponentMigrationContext) => unknown | undefined;
}

export function registerDeckComponent<Schema extends z.ZodObject<any>>(
  definition: RegisterDeckComponentInput<Schema>
): DeckComponentDefinition<z.output<Schema>, Schema>;

export class ComponentRegistry {
  constructor(definitions?: readonly DeckComponentDefinition<any, any>[]);
  register<Props, Schema extends z.ZodObject<any>>(
    definition: DeckComponentDefinition<Props, Schema>
  ): this;
  seal(): void;
  get sealed(): boolean;
  resolve<Props = unknown>(id: string, version: string): DeckComponentDefinition<Props, any> | undefined;
  parseProps<Props = unknown>(id: string, version: string, props: unknown): Props;
  resolveInstance(id: string, requestedVersion: string, props: unknown): ResolvedComponentInstance<any>;
  list(): readonly DeckComponentDefinition<any, any>[];
}

export function resolveDeckComponent<Props = unknown>(
  registry: ComponentRegistry,
  id: string,
  version: string
): DeckComponentDefinition<Props, any> | undefined;
```

Resolution rules covered by tests:

- registry key is exact `id@version`;
- duplicate exact registration fails;
- props schemas must be strict Zod object schemas;
- instance props are parsed before rendering;
- exact version resolution wins;
- no implicit major-version upgrade occurs;
- a known older version may migrate only through the target definition's explicit `migrateProps`;
- stable SemVer releases outrank prereleases during migration resolution;
- every registry insertion revalidates metadata, strict schema and Inspector contracts and requires a frozen `registerDeckComponent` result;
- registry sealing prevents registration after Presenter startup.

### Inspector metadata domain

Public field catalog:

```ts
type InspectorField =
  | InspectorTextField
  | InspectorNumberField
  | InspectorBooleanField
  | InspectorChoiceField
  | InspectorColorTokenField
  | InspectorAssetField
  | InspectorDataTableField
  | InspectorListField
  | InspectorObjectGroupField;
```

Supported `type` values:

```text
text
multiline
number
boolean
select
segmented
color-token
asset
data-table
list
object-group
```

Public operations:

```ts
export function createInspectorSchema(
  fields: readonly InspectorField[]
): InspectorSchema;

export function getInspectorValue(
  source: unknown,
  path: InspectorPath
): unknown;

export function patchComponentProps<Props>(
  definition: DeckComponentDefinition<Props>,
  currentProps: Props,
  path: InspectorPath,
  value: unknown
): ComponentPropsPatchResult<Props>;
```

Validation covered by tests:

- duplicate field IDs fail;
- duplicate effective update paths fail while relative child paths remain scoped under their object group or list;
- contradictory number/list ranges and duplicate option or data-table column values fail;
- `__proto__`, `prototype` and `constructor` paths fail;
- nested reads do not execute code;
- patches are immutable and limited to paths declared by the Inspector schema, including indexed list-item paths;
- every patch is validated against the complete strict component props schema before acceptance.

### Web Block source and manifest

Public budgets and reviewed imports:

```ts
export const MAX_WEB_BLOCK_SOURCE_BYTES = 1_048_576;
export const MAX_WEB_BLOCK_ASSET_BYTES = 4_194_304;

export const REVIEWED_WEB_BLOCK_IMPORTS = [
  "@deckory/web-block-runtime",
  "react",
  "react/jsx-runtime",
  "react-dom/client"
] as const;
```

Public contract:

```ts
export type WebBlockManifest = {
  id: StableId;
  version: string;
  entry: string;
  framework: "html" | "react";
  accessibleSummary: string;
  staticFallback: { type: "svg" | "png"; assetId: StableId };
  inspector?: InspectorSchema;
  allowedImports: string[];
  payloadBytes: number;
  localAssetBytes: number;
};

export type WebBlockSource = {
  entry: string;
  files: Record<string, string>;
};

export function defineWebBlockManifest(input: WebBlockManifestInput): WebBlockManifest;
export function validateWebBlockManifest(input: WebBlockManifestInput): WebBlockManifest;
export function validateWebBlockSource(
  source: WebBlockSource,
  manifest: WebBlockManifestInput
): WebBlockSourceValidationResult;
```

Denied source capabilities covered by tests:

- remote `http`, `https`, `data`, `blob`, `file`, protocol-relative and `node:` imports;
- package imports outside the reviewed manifest allowlist;
- unsafe paths and local imports that escape the virtual source root;
- missing entry files;
- unsupported file extensions;
- source larger than 1 MB or larger than the manifest-declared `payloadBytes`;
- declared local assets larger than 4 MB;
- CommonJS `require` and all dynamic import execution paths;
- `eval`, `Function` and `new Function` source constructs.

### Versioned Web Block bridge

Public contract:

```ts
export const WEB_BLOCK_PROTOCOL_VERSION = "1.0";
export const MAX_WEB_BLOCK_MESSAGE_BYTES = 262_144;

type WebBlockMessageType =
  | "ready"
  | "render-complete"
  | "render-error"
  | "resize-request"
  | "interaction-state"
  | "inspector-patch"
  | "export-svg";

export function createWebBlockMessage<T extends WebBlockMessageType>(
  type: T,
  blockId: string,
  payload: WebBlockMessagePayloadMap[T]
): WebBlockMessage<T>;

export function parseWebBlockMessage(value: unknown): WebBlockMessage;

export function validateWebBlockMessageEvent(
  event: WebBlockMessageEventLike,
  expected: { expectedSource: unknown; expectedBlockId: string }
): WebBlockMessageEventValidation;
```

Bridge validation covered by tests:

- unsupported protocol versions fail;
- malformed block IDs fail;
- non-serializable, excessively deep, excessively large or over-node-budget payloads fail;
- unsafe Inspector patch paths fail;
- iframe source mismatch fails;
- any origin other than opaque sandbox origin `null` fails;
- unexpected block IDs fail;
- resize requests are bounded;
- exported SVG payload size is bounded.

### Trusted component renderer host

Public structural integration contract:

```ts
export interface ComponentHostDefinition<Props = unknown> {
  id: string;
  version: string;
  parseProps(input: unknown): Props;
  render(context: { props: Props; mode: SceneRenderMode }): ReactNode;
  accessibleSummary(props: Props): string;
  exportCapabilities: readonly ComponentExportCapability[];
}

export function createComponentHostResetKey(
  element: ComponentHostElement,
  props: unknown
): string;

export function TrustedComponentHost<Props>(props: {
  element: ComponentHostElement;
  definition?: ComponentHostDefinition<Props>;
  mode: SceneRenderMode;
  exportTarget?: ComponentExportCapability;
}): ReactNode;

export class TrustedComponentErrorBoundary extends React.Component<...>;
```

Host behavior covered by tests:

- props validate before renderer execution;
- accessible summary exists outside component output;
- missing definition, invalid props, renderer failure and unsupported export are element-scoped fallbacks;
- one custom component failure cannot blank the slide;
- error boundaries remount when validated component props change;
- export mode fails closed when the export target is omitted or unsupported.

### Web Block renderer host and sandbox policy

Public contract:

```ts
export const WEB_BLOCK_RENDER_TIMEOUT_MS = 1500;

export function createWebBlockSandboxPolicy(): {
  sandbox: "allow-scripts";
  csp: string;
};

export function createWebBlockSrcDoc(
  bundle: CompiledWebBlockBundle,
  manifest: WebBlockHostManifest
): string;

export function parseWebBlockHostMessage(
  value: unknown,
  expected: { protocolVersion: string; blockId: string }
): WebBlockHostMessage | undefined;

export function reduceWebBlockLifecycle(
  state: WebBlockLifecycleState,
  event: WebBlockLifecycleEvent
): WebBlockLifecycleState;

export function shouldUseWebBlockFallback(
  state: WebBlockLifecycleState
): boolean;

export function WebBlockHost(props: {
  element: WebBlockHostElement;
  bundle?: CompiledWebBlockBundle;
  fallbackSrc?: string;
  mode: SceneRenderMode;
}): ReactNode;
```

Generated policy:

```text
sandbox="allow-scripts"
default-src 'none'
script-src 'unsafe-inline'
style-src 'unsafe-inline'
img-src data: blob:
font-src data:
media-src data: blob:
connect-src 'none'
object-src 'none'
frame-src 'none'
child-src 'none'
worker-src 'none'
base-uri 'none'
form-action 'none'
navigate-to 'none'
require-trusted-types-for 'script'
trusted-types deckory-web-block
```

Host behavior covered by tests:

- sandbox never grants `allow-same-origin`;
- executable bundle boundaries and embedded JSON literals cannot break out of the static script tag;
- the bootloader exposes a frozen `__deckoryWebBlockBridge`; only the reviewed runtime signals actual `render-complete`;
- lifecycle messages consumed by the host are strict, bounded and reject unexpected fields;
- accessible summary is outside the iframe;
- thumbnail mode disables pointer interaction;
- export mode never executes the iframe and uses static fallback;
- missing bundle, runtime error and timeout use static fallback;
- lifecycle timeout is 1.5 seconds;
- runtime messages must match iframe source, opaque origin, block ID and protocol version.

## RED/GREEN evidence

### Scene JSX

RED command:

```bash
pnpm --filter @deckory/sdk test -- src/jsx-runtime.test.tsx
```

Observed RED: JSX transform could not find `@deckory/sdk/jsx-dev-runtime` because the runtime did not exist.

GREEN evidence:

```text
1 test file passed
6 tests passed
SDK typecheck exited 0
```

### Registry and Inspector metadata

RED command:

```bash
pnpm --filter @deckory/sdk test -- src/component-registry.test.ts src/inspector-schema.test.ts
```

Observed RED: both production modules were missing.

GREEN evidence after implementation and strict-schema root-cause correction:

```text
3 test files passed
18 tests passed
SDK typecheck exited 0
```

### Web Block domain and bridge

RED command:

```bash
pnpm --filter @deckory/sdk test -- src/web-block.test.ts src/web-block-bridge.test.ts
```

Observed RED: both production modules were missing.

GREEN evidence:

```text
5 test files passed
29 tests passed
SDK typecheck exited 0
```

### Renderer hosts

RED command:

```bash
pnpm --filter @deckory/renderer test -- src/component-host.test.tsx src/web-block-host.test.tsx
```

Observed RED: both host modules were missing.

GREEN evidence:

```text
3 test files passed
13 tests passed
Renderer typecheck exited 0
```

## Baseline evidence

Run on the accepted base before implementation:

```bash
pnpm --filter @deckory/schema test
pnpm --filter @deckory/scene test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/slide-frame.test.tsx components/deck-thumbnail.test.tsx
pnpm typecheck
```

Observed results:

```text
@deckory/schema: 36 passed, 0 failed
@deckory/scene: 13 passed, 0 failed
@deckory/renderer: 3 passed, 0 failed
@deckory/present: 134 passed, 0 failed
workspace typecheck: passed
```

## Latest focused evidence before this manifest

```bash
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/sdk typecheck
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/renderer typecheck
```

Observed results:

```text
@deckory/sdk: 6 test files, 40 tests passed, 0 failed
@deckory/sdk typecheck: passed
@deckory/renderer: 3 test files, 17 tests passed, 0 failed
@deckory/renderer typecheck: passed
```

### Review and hardening batch

A final branch review added focused RED tests and fixes for:

- forged scene-node provenance;
- registry insertion that bypasses `registerDeckComponent`;
- stable-over-prerelease SemVer resolution;
- contradictory Inspector ranges, duplicate option/column values, scoped child paths and undeclared patches;
- manifest payload understatement, virtual-root escape, CommonJS and dynamic imports;
- unsafe or oversized bridge messages;
- export fail-closed behavior and component error-boundary reset keys;
- srcdoc JSON-literal escaping, strict host lifecycle messages, lifecycle reset and explicit runtime completion.

Fresh pre-commit quality gate:

```text
pnpm test: 290 passed, 0 failed
pnpm typecheck: passed
pnpm lint: passed
pnpm build: passed
@deckory/sdk: 6 test files, 40 passed
@deckory/renderer: 3 test files, 17 passed
git diff --check: passed
frozen shared paths: unchanged
allow-same-origin scan: clear
trusted eval/new Function scan: clear
```

The final session response records the hardening commit SHA.

## Changed production files

```text
packages/sdk/package.json
packages/sdk/tsconfig.json
packages/sdk/src/component-registry.ts
packages/sdk/src/define-scene.ts
packages/sdk/src/index.ts
packages/sdk/src/inspector-schema.ts
packages/sdk/src/jsx-dev-runtime.ts
packages/sdk/src/jsx-runtime.ts
packages/sdk/src/primitives.ts
packages/sdk/src/scene-node-internals.ts
packages/sdk/src/web-block-bridge.ts
packages/sdk/src/web-block.ts
packages/renderer/src/component-host.tsx
packages/renderer/src/web-block-host.tsx
```

Matching focused tests and typecheck fixtures are colocated in the same owned directories.

## Requests and integration instructions

- Renderer dependency-injection request:
  `docs/superpowers/parallel/requests/component-sdk-renderer-injection.md`
- Dependency, compiler, barrel and app integration request:
  `docs/superpowers/parallel/requests/component-sdk-dependencies-and-app-integration.md`
- Blocking schema request: none

The accepted V2 schema already carries component IDs, versions, opaque props, Web Block manifest records and source IDs. The SDK adds the stricter validation boundary without introducing a schema-to-SDK dependency cycle.

## Explicitly deferred to integration

- `esbuild-wasm@0.28.1` installation;
- in-memory compiler worker and allowlisted resolver;
- repository-controlled `@deckory/web-block-runtime` implementation;
- Studio advanced source editor;
- generated Studio Inspector React controls;
- component library/catalog UI;
- package lockfile update;
- renderer shared barrel exports;
- root renderer and `ElementRenderer` wiring;
- Presenter registry creation and sealing;
- source diagnostics visibility rules;
- asset-ID-to-static-fallback URL resolution;
- HTML, PNG, PDF and PPTX export integration;
- browser-level sandbox security proof.

## Security assumptions and remaining browser proof

Unit tests prove generated policy, source validation, message validation and fallback state contracts. They do not prove browser enforcement.

Coordinator-owned E2E must still run inside the integrated application and prove:

1. `window.parent.document` access throws or is denied;
2. parent/local application storage is unavailable to the opaque-origin iframe;
3. remote `fetch` and WebSocket connections are blocked by CSP;
4. top-level navigation, popups, forms and downloads are blocked;
5. invalid source, origin, block ID, protocol and message payloads are ignored;
6. a non-ready or non-completing block reaches the 1.5-second fallback;
7. static fallback appears in export and after runtime error;
8. thumbnails cannot receive pointer interaction;
9. Presenter does not expose source code, compiler diagnostics or editor-only dependencies;
10. one failed custom element does not blank sibling elements or the slide.

Do not weaken the sandbox, CSP, import allowlist or payload budgets if an integration fixture fails. Correct the fixture or add a separately reviewed local capability.

## Operational note

The connector-created worktree used a Windows `.git` pointer while shell commands execute under WSL. Git commands in this session therefore used the existing managed metadata explicitly through `GIT_DIR` and `GIT_WORK_TREE`. No Git metadata or source-checkout files were rewritten to work around the connector path mismatch.
