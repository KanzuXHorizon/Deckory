import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DeckAsset, Slide } from "@deckory/schema";
import { SlideFrame } from "./slide-frame";

const assets: DeckAsset[] = [{
  id: "product-avatar",
  type: "image",
  src: "/team/avatar-product.svg",
  mediaType: "image/svg+xml",
  source: { label: "Deckory local fixture" }
}];

const slide: Slide = {
  id: "asset-profile",
  layout: "process",
  components: [{
    id: "team",
    type: "team-showcase",
    props: {
      variant: "profile",
      members: [{
        id: "product-lead",
        name: "Product Lead",
        image: {
          assetId: "product-avatar",
          alt: "Chân dung minh hoạ Product Lead",
          position: "top"
        }
      }]
    }
  }]
};

describe("asset-backed slide rendering", () => {
  it("resolves a manifest asset without exposing the asset ID as a URL", () => {
    const html = renderToStaticMarkup(
      <SlideFrame
        slide={slide}
        deckId="asset-deck"
        assets={assets}
        sequenceStep={0}
        reducedMotion
      />
    );

    expect(html).toContain('src="/team/avatar-product.svg"');
    expect(html).toContain('alt="Chân dung minh hoạ Product Lead"');
    expect(html).not.toContain('src="product-avatar"');
  });

  it("falls back to a monogram when an unvalidated asset is unavailable", () => {
    const html = renderToStaticMarkup(
      <SlideFrame
        slide={slide}
        deckId="asset-deck"
        sequenceStep={0}
        reducedMotion
      />
    );

    expect(html).toContain("team-member-avatar--monogram");
    expect(html).toContain("PL");
    expect(html).not.toContain("<img");
  });
});
