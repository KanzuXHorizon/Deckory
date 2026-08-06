# Deckory V2 Component SDK and Custom Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let agents author highly custom slides through Scene JSX, trusted registered React components and isolated HTML/React Web Blocks without sacrificing document validation, Studio editing, accessibility, offline behavior or export disclosure.

**Architecture:** `@deckory/sdk` provides a custom JSX runtime that compiles approved primitives to `DeckDocumentV2`; it does not render DOM. Registered components execute in the trusted application bundle through a typed registry. Runtime arbitrary code is compiled locally and rendered only in a sandboxed iframe using a versioned bridge and explicit export fallback.

**Tech Stack:** TypeScript 5.9, React 19, Zod 4, esbuild-wasm, CSP sandbox, Trusted Types where supported, Vitest, Playwright.

## Global Constraints

- Plan 01 and Plan 02 must pass before this plan starts.
- Scene JSX must reject intrinsic HTML tags such as `div`, `script`, `iframe` and `style`.
- Registered components are repository-controlled code and must declare versioned props, Inspector fields, accessibility and export capabilities.
- Web Blocks have no parent DOM, storage, navigation or network access by default.
- Runtime code cannot install or fetch arbitrary npm packages.
- All custom-code errors remain element-scoped; one component cannot blank the slide.
- Presenter does not expose source code or diagnostics intended only for Studio.
- Do not commit, push or publish without separate authorization.

---

### Task 1: Create the Scene JSX runtime

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/index.ts`
- Create: `packages/sdk/src/jsx-runtime.ts`
- Create: `packages/sdk/src/jsx-dev-runtime.ts`
- Create: `packages/sdk/src/jsx-runtime.test.tsx`
- Create: `packages/sdk/src/primitives.ts`
- Create: `packages/sdk/src/define-scene.ts`
- Modify: `tsconfig.base.json`

**Interfaces:**
- Produces: `defineSceneDeck`, `defineSceneSlide`, `Slide`, `Group`, `Stack`, `Grid`, `Text`, `RichText`, `Image`, `Icon`, `Shape`, `Line`, `Connector`, `Svg`, `Chart`, `Table`, `Diagram`, `Component`, `WebBlock`, `EvidenceFooter`.
- JSX result: `SceneNodeDescription`, never a React element.

- [ ] **Step 1: Add the package manifest and JSX exports**

```json
{
  "name": "@deckory/sdk",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./jsx-runtime": "./src/jsx-runtime.ts",
    "./jsx-dev-runtime": "./src/jsx-dev-runtime.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@deckory/schema": "workspace:*",
    "zod": "4.4.3"
  }
}
```

- [ ] **Step 2: Write failing JSX compilation tests**

```tsx
/** @jsxImportSource @deckory/sdk */

it("compiles Scene JSX to explicit scene elements", () => {
  const slide = defineSceneSlide({ id: "cover", name: "Cover" }, () => (
    <Slide background={{ layers: [] }}>
      <Text id="title" frame={{ x: 72, y: 64, width: 700, height: 140 }}>
        Deckory V2
      </Text>
    </Slide>
  ));
  expect(slide.elements[0]).toMatchObject({
    id: "title",
    kind: "text",
    frame: { x: 72, y: 64, width: 700, height: 140 },
    content: { text: "Deckory V2" }
  });
});

it("rejects duplicate IDs before document validation", () => {
  expect(() => defineSceneSlide({ id: "cover", name: "Cover" }, () => (
    <Slide background={{ layers: [] }}>
      <Text id="title" frame={frame}>One</Text>
      <Text id="title" frame={frame}>Two</Text>
    </Slide>
  ))).toThrow(/ID.*trùng/i);
});
```

- [ ] **Step 3: Run SDK tests and confirm RED**

Run: `pnpm --filter @deckory/sdk test -- src/jsx-runtime.test.tsx`

Expected: FAIL because the SDK package does not exist.

- [ ] **Step 4: Implement a non-React JSX runtime**

The runtime must implement `jsx`, `jsxs` and `Fragment` and return immutable scene-node descriptions. Primitive functions map props and children to strict V2 element content. Text children are accepted only by text-capable primitives.

- [ ] **Step 5: Add intrinsic-element rejection at type and runtime boundaries**

Declare only approved primitives in `JSX.IntrinsicElements` or expose capitalized components. A manually constructed lowercase tag must fail with a Vietnamese diagnostic naming the unsupported tag.

- [ ] **Step 6: Validate the final deck through `DeckDocumentV2Schema`**

`defineSceneDeck` returns only a parsed V2 document; it cannot cast invalid output.

- [ ] **Step 7: Run verification**

```bash
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/sdk typecheck
pnpm --filter @deckory/schema test
```

Expected: PASS.

- [ ] **Step 8: Commit Scene JSX**

```bash
git add packages/sdk tsconfig.base.json pnpm-lock.yaml
git commit -m "feat(sdk): compile Scene JSX to typed deck scenes"
```

---

### Task 2: Add the trusted component registry contract

**Files:**
- Create: `packages/sdk/src/component-registry.ts`
- Create: `packages/sdk/src/component-registry.test.tsx`
- Create: `packages/sdk/src/inspector-schema.ts`
- Create: `packages/sdk/src/inspector-schema.test.ts`
- Modify: `packages/sdk/src/index.ts`
- Modify: `packages/renderer/src/element-renderer.tsx`
- Modify: `packages/renderer/package.json`

**Interfaces:**
- Produces: `registerDeckComponent`, `DeckComponentDefinition`, `InspectorSchema`, `ComponentRegistry`, `resolveDeckComponent`.
- Renderer consumes registry by explicit dependency injection.

- [ ] **Step 1: Write failing registry tests**

```tsx
const scoreRing = registerDeckComponent({
  id: "score-ring",
  version: "1.0.0",
  propsSchema: z.object({ value: z.number().min(0).max(100) }).strict(),
  defaultFrame: { width: 320, height: 320 },
  inspector: [{ id: "value", type: "number", label: "Điểm", path: ["value"], min: 0, max: 100 }],
  renderer: ({ props }) => <div>{props.value}</div>,
  accessibleSummary: ({ value }) => `Điểm ${value} trên 100`,
  exportCapabilities: ["html", "svg", "png", "pdf"]
});

it("rejects duplicate component registrations", () => {
  const registry = new ComponentRegistry();
  registry.register(scoreRing);
  expect(() => registry.register(scoreRing)).toThrow(/score-ring.*đã đăng ký/i);
});

it("validates instance props before rendering", () => {
  expect(() => registry.parseProps("score-ring", { value: 120 })).toThrow();
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/sdk test -- src/component-registry.test.tsx src/inspector-schema.test.ts`

Expected: FAIL because registry types do not exist.

- [ ] **Step 3: Implement a versioned registry**

The registry key is `id@version`. Resolution rules:

- exact version first;
- no implicit major-version upgrade;
- missing component returns an explicit renderer fallback;
- optional `migrateProps` handles known older versions;
- component packages cannot register after Presenter rendering begins.

- [ ] **Step 4: Validate Inspector field schemas**

Supported initial field types:

- text;
- multiline text;
- number;
- boolean;
- select;
- segmented control;
- color token;
- asset;
- data table;
- list editor;
- object group.

Every field has a stable ID, label, path, validation and optional help copy.

- [ ] **Step 5: Render component instances through an error boundary**

`element-renderer.tsx` receives the registry and renders `component-instance` elements. Errors must produce an element-level fallback with the component ID and accessible summary, not a full-slide crash.

- [ ] **Step 6: Run SDK and renderer verification**

```bash
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/sdk typecheck
pnpm --filter @deckory/renderer typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the registry**

```bash
git add packages/sdk/src/component-registry.ts packages/sdk/src/component-registry.test.tsx packages/sdk/src/inspector-schema.ts packages/sdk/src/inspector-schema.test.ts packages/sdk/src/index.ts packages/renderer/src/element-renderer.tsx packages/renderer/package.json pnpm-lock.yaml
git commit -m "feat(sdk): register editable custom React components"
```

---

### Task 3: Generate Studio Inspector controls for registered components

**Files:**
- Create: `apps/present/components/studio-v2/inspector/component-inspector-fields.tsx`
- Create: `apps/present/components/studio-v2/inspector/component-inspector-fields.test.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`
- Modify: `apps/present/components/studio-v2/inspector/scene-inspector.tsx`
- Modify: `apps/present/lib/component-catalog.ts`

**Interfaces:**
- Consumes: `InspectorSchema`, registered component definition.
- Produces: validated `patch-element` commands for component props.

- [ ] **Step 1: Write failing generated-field tests**

```tsx
it("renders a numeric control from the component inspector schema", () => {
  const html = renderToStaticMarkup(
    <ComponentInspectorFields definition={scoreRing} element={scoreRingElement} onPatch={() => {}} />
  );
  expect(html).toContain('aria-label="Điểm"');
  expect(html).toContain('type="number"');
});

it("does not emit an invalid prop patch", () => {
  const result = patchComponentProps(scoreRing, { value: 120 });
  expect(result.ok).toBe(false);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `pnpm --filter @deckory/present test -- components/studio-v2/inspector/component-inspector-fields.test.tsx`

Expected: FAIL because generated component fields do not exist.

- [ ] **Step 3: Implement generated fields**

Fields validate on input and again before command dispatch. Invalid intermediate text may remain in local input state but cannot be committed to the document.

- [ ] **Step 4: Add registered components to the component library**

Library cards show:

- name;
- purpose;
- default size;
- editable fields;
- export capabilities;
- accessibility status;
- package/version.

- [ ] **Step 5: Run verification**

```bash
pnpm --filter @deckory/present test -- components/studio-v2/inspector component-catalog.test.ts
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit generated editing**

```bash
git add apps/present/components/studio-v2/inspector apps/present/lib/component-catalog.ts apps/present/lib/component-catalog.test.ts
git commit -m "feat(studio): edit registered component props"
```

---

### Task 4: Define the Web Block source and bridge contracts

**Files:**
- Create: `packages/sdk/src/web-block.ts`
- Create: `packages/sdk/src/web-block.test.ts`
- Create: `packages/sdk/src/web-block-bridge.ts`
- Create: `packages/sdk/src/web-block-bridge.test.ts`
- Modify: `packages/sdk/src/index.ts`
- Modify: `packages/schema/src/v2.ts`
- Modify: `packages/schema/src/v2.test.ts`

**Interfaces:**
- Produces: `WebBlockSource`, `WebBlockManifest`, `WebBlockMessage`, `WEB_BLOCK_PROTOCOL_VERSION`, `validateWebBlockManifest`.

- [ ] **Step 1: Write failing manifest tests**

```ts
it("requires a static fallback and accessible summary", () => {
  expect(() => WebBlockManifestSchema.parse({
    id: "custom-radar",
    entry: "index.tsx"
  })).toThrow();
});

it("rejects remote imports", () => {
  expect(validateWebBlockSource({
    files: { "index.tsx": 'import x from "https://example.com/x.js";' },
    entry: "index.tsx"
  }).diagnostics[0]?.code).toBe("remote-import-denied");
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm --filter @deckory/sdk test -- src/web-block.test.ts src/web-block-bridge.test.ts`

Expected: FAIL because Web Block contracts do not exist.

- [ ] **Step 3: Implement a bounded source manifest**

Required manifest fields:

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
};
```

Maximum initial payload is 1 MB source plus 4 MB local assets. The allowlist initially contains only the Deckory Web Block runtime and React packages bundled by Deckory.

- [ ] **Step 4: Define the bridge messages**

Allowed message types:

- `ready`;
- `render-complete`;
- `render-error`;
- `resize-request`;
- `interaction-state`;
- `inspector-patch`;
- `export-svg`.

Every message includes protocol version, block ID and a validated payload.

- [ ] **Step 5: Run schema and SDK verification**

```bash
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/schema test
pnpm --filter @deckory/sdk typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit Web Block contracts**

```bash
git add packages/sdk/src/web-block.ts packages/sdk/src/web-block.test.ts packages/sdk/src/web-block-bridge.ts packages/sdk/src/web-block-bridge.test.ts packages/sdk/src/index.ts packages/schema/src/v2.ts packages/schema/src/v2.test.ts
git commit -m "feat(sdk): define isolated Web Block contracts"
```

---

### Task 5: Compile Web Blocks locally with an allowlisted resolver

**Files:**
- Create: `apps/present/lib/web-block-compiler.ts`
- Create: `apps/present/lib/web-block-compiler.test.ts`
- Create: `apps/present/workers/web-block-compiler.worker.ts`
- Modify: `apps/present/package.json`
- Modify: `apps/present/next.config.ts`

**Interfaces:**
- Produces: `compileWebBlock(source, manifest): Promise<WebBlockBundleResult>`.
- Uses: `esbuild-wasm` in a worker with an in-memory filesystem and import allowlist.

- [ ] **Step 1: Add the compiler dependency**

Run: `pnpm --filter @deckory/present add esbuild-wasm`

Expected: package manifest and lockfile update.

- [ ] **Step 2: Write failing compiler tests**

```ts
it("compiles a local React entry without network resolution", async () => {
  const result = await compileWebBlock(reactFixture, manifest);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.code).toContain("custom-radar");
});

it("returns a diagnostic for a disallowed package", async () => {
  const result = await compileWebBlock(disallowedImportFixture, manifest);
  expect(result).toMatchObject({
    ok: false,
    diagnostics: [expect.objectContaining({ code: "import-not-allowed" })]
  });
});
```

- [ ] **Step 3: Run compiler tests and confirm RED**

Run: `pnpm --filter @deckory/present test -- lib/web-block-compiler.test.ts`

Expected: FAIL because compiler implementation does not exist.

- [ ] **Step 4: Implement worker compilation**

Compiler rules:

- no HTTP resolver;
- no filesystem outside the supplied source map;
- TS/TSX/JS/JSX/CSS only;
- deterministic target and JSX settings;
- inline source map for Studio diagnostics only;
- 1.5-second timeout;
- return code and CSS separately;
- call `esbuild.stop()` when the worker is disposed.

- [ ] **Step 5: Verify compilation and typecheck**

```bash
pnpm --filter @deckory/present test -- lib/web-block-compiler.test.ts
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the compiler**

```bash
git add apps/present/lib/web-block-compiler.ts apps/present/lib/web-block-compiler.test.ts apps/present/workers/web-block-compiler.worker.ts apps/present/package.json apps/present/next.config.ts pnpm-lock.yaml
git commit -m "feat(studio): compile Web Blocks locally"
```

---

### Task 6: Render Web Blocks in a hardened sandbox

**Files:**
- Create: `packages/renderer/src/web-block-renderer.tsx`
- Create: `packages/renderer/src/web-block-renderer.test.tsx`
- Create: `apps/present/components/studio-v2/web-block-source-editor.tsx`
- Create: `apps/present/components/studio-v2/web-block-source-editor.test.tsx`
- Modify: `packages/renderer/src/element-renderer.tsx`
- Modify: `apps/present/components/studio-v2/inspector/field-registry.ts`

**Interfaces:**
- Produces: `WebBlockRenderer`, `createWebBlockSrcDoc`, source editor and capability warning.

- [ ] **Step 1: Write failing sandbox policy tests**

```ts
it("creates a srcdoc with a deny-by-default CSP", () => {
  const html = createWebBlockSrcDoc(bundle, manifest);
  expect(html).toContain("default-src 'none'");
  expect(html).toContain("connect-src 'none'");
  expect(html).toContain("img-src data: blob:");
});

it("never grants same-origin access", () => {
  const html = renderToStaticMarkup(<WebBlockRenderer element={element} mode="studio" />);
  expect(html).toContain('sandbox="allow-scripts"');
  expect(html).not.toContain("allow-same-origin");
});
```

- [ ] **Step 2: Run renderer tests and confirm RED**

Run: `pnpm --filter @deckory/renderer test -- src/web-block-renderer.test.tsx`

Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Implement hardened `srcdoc` generation**

Use a static bootloader, escaped bundle payload and explicit CSP. Do not concatenate unvalidated raw HTML around executable content. Apply Trusted Types in browsers that support it and keep sanitization tests independent of browser support.

- [ ] **Step 4: Implement iframe lifecycle**

- wait for `ready` and `render-complete`;
- timeout at 1.5 seconds;
- show static fallback on error;
- validate message origin/source and protocol;
- disable pointer interaction in thumbnails and static export;
- preserve the accessible summary outside the iframe.

- [ ] **Step 5: Add an Advanced source editor**

The editor shows:

- file list;
- source diagnostics;
- payload size;
- allowlisted imports;
- sandbox capability warning;
- export fallback;
- compile and preview actions.

It remains hidden from ordinary Content/Layout editing.

- [ ] **Step 6: Run focused verification**

```bash
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test -- components/studio-v2/web-block-source-editor.test.tsx
pnpm --filter @deckory/renderer typecheck
pnpm --filter @deckory/present typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit sandbox rendering**

```bash
git add packages/renderer/src/web-block-renderer.tsx packages/renderer/src/web-block-renderer.test.tsx packages/renderer/src/element-renderer.tsx apps/present/components/studio-v2/web-block-source-editor.tsx apps/present/components/studio-v2/web-block-source-editor.test.tsx apps/present/components/studio-v2/inspector/field-registry.ts
git commit -m "feat(renderer): isolate custom Web Blocks"
```

---

### Task 7: Prove code authoring and sandbox security in browser tests

**Files:**
- Create: `decks/scene-sdk-gallery/package.json`
- Create: `decks/scene-sdk-gallery/tsconfig.json`
- Create: `decks/scene-sdk-gallery/deck.tsx`
- Create: `decks/scene-sdk-gallery/components/score-ring.tsx`
- Create: `decks/scene-sdk-gallery/web-blocks/custom-radar.tsx`
- Modify: `apps/present/lib/deck-catalog.ts`
- Create: `tests/e2e/scene-sdk.spec.ts`
- Create: `tests/e2e/web-block-security.spec.ts`

**Interfaces:**
- Provides one complete gallery proving Scene JSX, registered component editing and Web Block isolation.

- [ ] **Step 1: Author the gallery with real complete slides**

The gallery must include:

- native Scene JSX slide;
- registered score-ring component;
- registered interactive relationship visual;
- React Web Block using only local runtime imports;
- HTML Web Block;
- an intentional compile error fixture visible only in Studio diagnostics;
- explicit evidence labels and notes.

- [ ] **Step 2: Add browser assertions**

Security test attempts from inside the Web Block must confirm:

- `window.parent.document` access fails;
- `localStorage` is unavailable or isolated;
- `fetch` to a remote URL is blocked;
- top navigation is blocked;
- invalid bridge messages are ignored;
- static fallback appears when the block times out.

- [ ] **Step 3: Run E2E and confirm RED on the first missing safeguard**

Run:

```bash
pnpm test:e2e -- tests/e2e/scene-sdk.spec.ts tests/e2e/web-block-security.spec.ts
```

Expected before final correction: FAIL on an unimplemented gallery or sandbox assertion.

- [ ] **Step 4: Correct only the exposed SDK/sandbox defects**

Do not broaden the import allowlist to make a fixture pass. Change the fixture or add a reviewed local capability.

- [ ] **Step 5: Run plan-level verification**

```bash
pnpm --filter @deckory/sdk test
pnpm --filter @deckory/renderer test
pnpm --filter @deckory/present test
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e -- tests/e2e/scene-sdk.spec.ts tests/e2e/web-block-security.spec.ts
```

Expected: all commands exit 0.

- [ ] **Step 6: Inspect screenshots and runtime logs**

Confirm the gallery is visually authored rather than a technical placeholder, registered controls remain editable, Web Block warnings are understandable and no source code appears in Presenter.

- [ ] **Step 7: Commit the verified SDK proof**

```bash
git add decks/scene-sdk-gallery apps/present/lib/deck-catalog.ts tests/e2e/scene-sdk.spec.ts tests/e2e/web-block-security.spec.ts
git commit -m "test(sdk): prove custom scene and Web Block authoring"
```

## Plan Self-Review

- Spec coverage: Scene JSX, registered React components, generated Inspector fields, local compilation, iframe sandbox, export fallback, offline behavior and security tests are covered.
- Placeholder scan: import policy, payload limits, protocol messages and failure behavior are explicit.
- Type consistency: Scene JSX produces scene nodes; registered components use `DeckComponentDefinition`; Web Blocks use `WebBlockManifest` and the versioned bridge.
- Exit condition: Plan 04 starts only after agents can author a complete custom deck, humans can edit supported props in Studio and arbitrary code remains isolated under browser tests.
