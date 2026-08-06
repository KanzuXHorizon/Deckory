import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ComponentRegistry,
  registerDeckComponent,
  resolveDeckComponent
} from "./component-registry";
import { createInspectorSchema } from "./inspector-schema";

const inspector = createInspectorSchema([
  { id: "value", type: "number", label: "Điểm", path: ["value"], min: 0, max: 100 }
]);

const scoreRing = registerDeckComponent({
  id: "score-ring",
  version: "1.0.0",
  displayName: "Score ring",
  purpose: "Hiển thị điểm trên thang 100",
  propsSchema: z.object({ value: z.number().min(0).max(100) }).strict(),
  defaultFrame: { width: 320, height: 320 },
  inspector,
  renderer: ({ props }) => createElement("span", null, props.value),
  accessibleSummary: ({ value }) => `Điểm ${value} trên 100`,
  exportCapabilities: ["html", "svg", "png", "pdf"]
});

describe("trusted component registry", () => {
  it("rejects duplicate id@version registrations", () => {
    const registry = new ComponentRegistry();
    registry.register(scoreRing);
    expect(() => registry.register(scoreRing)).toThrow(/score-ring@1\.0\.0.*đã đăng ký/i);
  });

  it("revalidates definitions registered without the trusted factory", () => {
    const bypassedDefinition = {
      ...scoreRing,
      id: "Unsafe ID",
      propsSchema: z.object({ value: z.number() })
    } as typeof scoreRing;

    expect(() => new ComponentRegistry().register(bypassedDefinition)).toThrow(/stable kebab-case|propsSchema.*strict/i);
  });

  it("requires strict Zod object props schemas", () => {
    expect(() => registerDeckComponent({
      ...scoreRing,
      id: "loose-component",
      propsSchema: z.object({ value: z.number() })
    })).toThrow(/propsSchema.*strict/i);
  });

  it("validates instance props before rendering", () => {
    const registry = new ComponentRegistry();
    registry.register(scoreRing);
    expect(() => registry.parseProps("score-ring", "1.0.0", { value: 120 })).toThrow();
    expect(() => registry.parseProps("score-ring", "1.0.0", { value: 80, extra: true })).toThrow();
    expect(registry.parseProps("score-ring", "1.0.0", { value: 80 })).toEqual({ value: 80 });
  });

  it("resolves exact versions before considering explicit same-major migration", () => {
    const registry = new ComponentRegistry();
    registry.register(scoreRing);
    registry.register(registerDeckComponent({
      ...scoreRing,
      version: "1.1.0",
      migrateProps: ({ fromVersion, props }) => fromVersion === "1.0.0" ? props : undefined
    }));

    expect(registry.resolveInstance("score-ring", "1.0.0", { value: 61 })).toMatchObject({
      status: "ready",
      requestedVersion: "1.0.0",
      resolvedVersion: "1.0.0",
      migrated: false,
      props: { value: 61 }
    });
  });

  it("permits only an explicit migration within the requested major version", () => {
    const registry = new ComponentRegistry();
    registry.register(registerDeckComponent({
      ...scoreRing,
      version: "1.2.0",
      migrateProps: ({ fromVersion, props }) => fromVersion === "1.0.0" ? props : undefined
    }));
    registry.register(registerDeckComponent({
      ...scoreRing,
      version: "2.0.0",
      migrateProps: ({ props }) => props
    }));

    expect(registry.resolveInstance("score-ring", "1.0.0", { value: 72 })).toMatchObject({
      status: "ready",
      requestedVersion: "1.0.0",
      resolvedVersion: "1.2.0",
      migrated: true
    });
    expect(registry.resolveInstance("score-ring", "3.0.0", { value: 72 })).toMatchObject({
      status: "missing",
      componentId: "score-ring",
      requestedVersion: "3.0.0"
    });
  });

  it("prefers a stable semantic version over its prerelease during migration", () => {
    const registry = new ComponentRegistry([
      registerDeckComponent({
        ...scoreRing,
        version: "1.2.0-beta.2",
        migrateProps: ({ props }) => props
      }),
      registerDeckComponent({
        ...scoreRing,
        version: "1.2.0",
        migrateProps: ({ props }) => props
      })
    ]);

    expect(registry.resolveInstance("score-ring", "1.0.0", { value: 72 })).toMatchObject({
      status: "ready",
      resolvedVersion: "1.2.0"
    });
  });

  it("stops registrations after the registry is sealed for presentation", () => {
    const registry = new ComponentRegistry();
    registry.register(scoreRing);
    registry.seal();
    expect(() => registry.register(registerDeckComponent({ ...scoreRing, version: "1.1.0" }))).toThrow(/đã khóa/i);
  });

  it("resolves definitions by exact id and version without a global registry", () => {
    const registry = new ComponentRegistry([scoreRing]);
    expect(resolveDeckComponent(registry, "score-ring", "1.0.0")).toBe(scoreRing);
    expect(resolveDeckComponent(registry, "score-ring", "9.0.0")).toBeUndefined();
  });
});
