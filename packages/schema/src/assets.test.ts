import { describe, expect, it } from "vitest";
import { resolveDeckAsset, resolveTeamImageSource, validateDeck } from "./index.js";

function assetDeck() {
  return {
    id: "asset-deck",
    version: 1,
    title: "Asset deck",
    locale: "vi-VN",
    themeId: "asset-deck",
    assets: [
      {
        id: "product-avatar",
        type: "image",
        src: "/team/avatar-product.svg",
        mediaType: "image/svg+xml",
        width: 512,
        height: 512,
        source: { label: "Deckory local fixture" }
      }
    ],
    slides: [
      {
        id: "team",
        layout: "process",
        components: [
          {
            id: "team-showcase",
            type: "team-showcase",
            props: {
              variant: "profile",
              members: [
                {
                  id: "product-lead",
                  name: "Product Lead",
                  image: {
                    assetId: "product-avatar",
                    alt: "Chân dung minh hoạ Product Lead",
                    position: "top"
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  } as const;
}

describe("deck asset manifest", () => {
  it("accepts a local image manifest and resolves a team image reference", () => {
    const result = validateDeck(assetDeck());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const image = result.deck.slides[0]!.components[0]!;
    expect(image.type).toBe("team-showcase");
    if (image.type !== "team-showcase") return;
    const teamImage = image.props.members[0]!.image!;

    expect(resolveDeckAsset(result.deck.assets, "product-avatar")?.src).toBe("/team/avatar-product.svg");
    expect(resolveTeamImageSource(result.deck.assets, teamImage)).toBe("/team/avatar-product.svg");
  });

  it("rejects duplicate asset IDs with a manifest-scoped diagnostic", () => {
    const deck = assetDeck();
    const result = validateDeck({ ...deck, assets: [deck.assets[0], { ...deck.assets[0] }] });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({
        propertyPath: "assets.1.id",
        expected: "unique stable kebab-case ID"
      })]
    });
  });

  it("rejects remote and path-traversing runtime asset sources", () => {
    const deck = assetDeck();
    const remote = validateDeck({
      ...deck,
      assets: [{ ...deck.assets[0], src: "https://example.com/avatar.svg" }]
    });
    const traversal = validateDeck({
      ...deck,
      assets: [{ ...deck.assets[0], src: "/team/../secret.svg" }]
    });

    expect(remote).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ propertyPath: "assets.0.src" })]
    });
    expect(traversal).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ propertyPath: "assets.0.src" })]
    });
  });

  it("rejects missing asset references without falling back to a different image", () => {
    const deck = assetDeck();
    const result = validateDeck({
      ...deck,
      slides: [{
        ...deck.slides[0],
        components: [{
          ...deck.slides[0].components[0],
          props: {
            ...deck.slides[0].components[0].props,
            members: [{
              ...deck.slides[0].components[0].props.members[0],
              image: {
                assetId: "missing-avatar",
                alt: "Ảnh không tồn tại"
              }
            }]
          }
        }]
      }]
    });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({
        slideId: "team",
        componentId: "team-showcase",
        propertyPath: "slides.0.components.0.props.members.0.image.assetId",
        received: "missing-avatar"
      })]
    });
  });

  it("requires exactly one of src or assetId for a team image", () => {
    const deck = assetDeck();
    const image = deck.slides[0].components[0].props.members[0].image;
    const both = validateDeck({
      ...deck,
      slides: [{
        ...deck.slides[0],
        components: [{
          ...deck.slides[0].components[0],
          props: {
            ...deck.slides[0].components[0].props,
            members: [{ ...deck.slides[0].components[0].props.members[0], image: { ...image, src: "/team/avatar-design.svg" } }]
          }
        }]
      }]
    });

    expect(both).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({
        propertyPath: "slides.0.components.0.props.members.0.image"
      })]
    });
  });
});
