/** @jsxImportSource @deckory/sdk */

import { describe, expect, it } from "vitest";
import { defineSceneDeck, defineSceneSlide } from "./define-scene";
import { jsx, normalizeSceneChildren } from "./jsx-runtime";
import { Group, Shape, Slide, Text } from "./primitives";

const frame = { x: 72, y: 64, width: 700, height: 140 } as const;

describe("Scene JSX runtime", () => {
  it("compiles approved Scene JSX to explicit serializable scene elements", () => {
    const slide = defineSceneSlide({ id: "cover", name: "Cover" }, () => (
      <Slide background={{ layers: [] }}>
        <Text id="title" frame={frame}>Deckory V2</Text>
      </Slide>
    ));

    expect(slide.elements[0]).toMatchObject({
      id: "title",
      name: "title",
      kind: "text",
      frame,
      zIndex: 0,
      content: { text: "Deckory V2" },
      accessibility: { label: "Deckory V2" }
    });
    expect(JSON.parse(JSON.stringify(slide))).toEqual(slide);
    expect(Object.isFrozen(slide)).toBe(true);
    expect(Object.isFrozen(slide.elements[0]?.content)).toBe(true);
  });

  it("flattens approved container primitives while preserving hierarchy", () => {
    const slide = defineSceneSlide({ id: "hierarchy", name: "Hierarchy" }, () => (
      <Slide background={{ layers: [] }}>
        <Group id="panel" frame={{ x: 20, y: 20, width: 400, height: 300 }} accessibleSummary="Nhóm nội dung">
          <Shape id="surface" frame={{ x: 0, y: 0, width: 400, height: 300 }} shape="rectangle" decorative />
          <Text id="label" frame={{ x: 24, y: 24, width: 200, height: 60 }}>Nhãn</Text>
        </Group>
      </Slide>
    ));

    expect(slide.elements.map((element) => element.id)).toEqual(["panel", "surface", "label"]);
    expect(slide.elements[0]).toMatchObject({ content: { children: ["surface", "label"] } });
    expect(slide.elements[1]?.parentId).toBe("panel");
    expect(slide.elements[2]?.parentId).toBe("panel");
  });

  it("rejects duplicate IDs before document validation", () => {
    expect(() => defineSceneSlide({ id: "duplicate", name: "Duplicate" }, () => (
      <Slide background={{ layers: [] }}>
        <Text id="title" frame={frame}>One</Text>
        <Text id="title" frame={frame}>Two</Text>
      </Slide>
    ))).toThrow(/ID.*title.*trùng/i);
  });

  it("rejects intrinsic HTML tags at the runtime boundary", () => {
    expect(() => jsx("div", { children: "Không hợp lệ" })).toThrow(/div.*không được hỗ trợ/i);
    expect(() => jsx("script", { children: "alert(1)" })).toThrow(/script.*không được hỗ trợ/i);
  });

  it("rejects forged scene-node objects that were not created by approved primitives", () => {
    expect(() => normalizeSceneChildren({
      nodeType: "element",
      element: {
        id: "forged",
        name: "Forged",
        kind: "text",
        frame,
        zIndex: 0,
        content: { text: "Bypass" },
        accessibility: { label: "Bypass" }
      },
      children: []
    })).toThrow(/primitive|scene node.*không hợp lệ/i);
  });

  it("rejects executable handlers and function-valued props", () => {
    expect(() => jsx(Text, {
      id: "unsafe",
      frame,
      children: "Unsafe",
      onClick: () => undefined
    })).toThrow(/thực thi.*onClick|onClick.*thực thi/i);

    expect(() => jsx(Shape, {
      id: "unsafe-shape",
      frame,
      shape: "rectangle",
      data: { formatter: () => "unsafe" }
    })).toThrow(/function|hàm.*không thể tuần tự/i);
  });

  it("returns only a DeckDocumentV2 parsed by the accepted schema", () => {
    const slide = defineSceneSlide({ id: "cover", name: "Cover" }, () => (
      <Slide background={{ layers: [] }}>
        <Text id="title" frame={frame}>Deckory V2</Text>
      </Slide>
    ));

    const deck = defineSceneDeck({
      id: "sdk-fixture",
      title: "SDK fixture",
      locale: "vi-VN",
      theme: { id: "deckory-editorial", tokens: {} }
    }, [slide]);

    expect(deck).toMatchObject({
      schemaVersion: 2,
      revision: 0,
      canvas: { width: 1280, height: 720, unit: "px" },
      slides: [{ id: "cover" }]
    });
  });
});
