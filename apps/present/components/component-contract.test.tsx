import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_LAYOUTS,
  validateDeck,
  type Slide
} from "@deckory/schema";
import { createComponent, isCompatible } from "../lib/component-catalog";
import { ComponentInspector } from "./component-inspector";
import { SlideFrame } from "./slide-frame";

describe("Deckory component contract coverage", () => {
  for (const type of SUPPORTED_COMPONENT_TYPES) {
    it(`${type} is supported by schema, Studio catalog, Inspector and renderer`, () => {
      const layout = SUPPORTED_LAYOUTS.find((candidate) => isCompatible(candidate, type));
      expect(layout, `${type} must be assigned to at least one supported layout`).toBeDefined();

      const component = createComponent(type, `${type}-fixture`);
      const slide: Slide = {
        id: `${type}-slide`,
        layout: layout!,
        components: [component]
      };
      const validation = validateDeck({
        id: `${type}-contract`,
        version: 1,
        title: `${type} contract`,
        locale: "vi-VN",
        themeId: "deckory-editorial",
        ...(type === "media-showcase" ? { assets: [
          { id: "product-shot-one", type: "image", src: "/fixtures/product-one.svg", mediaType: "image/svg+xml" },
          { id: "product-shot-two", type: "image", src: "/fixtures/product-two.svg", mediaType: "image/svg+xml" }
        ] } : {}),
        slides: [slide]
      });

      expect(validation, `${type} default must satisfy the typed DeckDocument contract`).toMatchObject({ ok: true });

      const inspectorHtml = renderToStaticMarkup(
        <ComponentInspector component={component} onChange={() => undefined} />
      );
      expect(inspectorHtml.length, `${type} must expose an Inspector surface`).toBeGreaterThan(20);

      const slideHtml = renderToStaticMarkup(
        <SlideFrame slide={slide} sequenceStep={0} reducedMotion={false} motionDisabled />
      );
      expect(slideHtml).toContain(`component-slot--${type}`);
      expect(slideHtml).toContain(`data-component-id="${type}-fixture"`);
    });
  }
});
