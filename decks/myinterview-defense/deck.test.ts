import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DeckDocumentV2Schema } from "@deckory/schema";
import { MYINTERVIEW_SLIDE_ORDER, MYINTERVIEW_SLIDES, MYINTERVIEW_TEAM } from "./content.js";
import { myInterviewDefense } from "./deck.js";

const expectedSlideIds = [
  "cover", "member-hao", "member-minh", "member-quynh", "member-hoang", "member-thu",
  "topic", "current-state-gap", "solution", "architecture", "ai-scoring",
  "data-responsible-ai", "implementation", "testing-evidence", "limitations-roadmap",
  "conclusion", "demo", "appendix-backend", "appendix-state-machines", "appendix-rubric",
  "appendix-auth-data", "appendix-voice", "appendix-deployment-stack"
] as const;

describe("MyInterview canonical Scene V2 defense deck", () => {
  it("is the only canonical V2 document with the accepted 23-slide story", () => {
    expect(myInterviewDefense.schemaVersion).toBe(2);
    expect(myInterviewDefense.id).toBe("myinterview-defense");
    expect(myInterviewDefense.slides.map((slide) => slide.id)).toEqual(expectedSlideIds);
    expect(MYINTERVIEW_SLIDE_ORDER).toEqual(expectedSlideIds);
    expect(DeckDocumentV2Schema.safeParse(myInterviewDefense).success).toBe(true);
  });

  it("keeps every slide self-contained, accessible and inside 1280 by 720", () => {
    for (const slide of myInterviewDefense.slides) {
      expect(slide.purpose?.trim(), `${slide.id}: purpose`).toBeTruthy();
      expect(slide.conclusion?.trim(), `${slide.id}: conclusion`).toBeTruthy();
      expect(slide.notes?.trim(), `${slide.id}: notes`).toBeTruthy();
      expect(slide.elements.some((element) => element.kind === "evidence-footer"), `${slide.id}: evidence footer`).toBe(true);
      for (const element of slide.elements) {
        expect(element.frame.width, `${slide.id}.${element.id}: width`).toBeGreaterThan(0);
        expect(element.frame.height, `${slide.id}.${element.id}: height`).toBeGreaterThan(0);
        expect(element.frame.x, `${slide.id}.${element.id}: x`).toBeGreaterThanOrEqual(0);
        expect(element.frame.y, `${slide.id}.${element.id}: y`).toBeGreaterThanOrEqual(0);
        expect(element.frame.x + element.frame.width, `${slide.id}.${element.id}: right`).toBeLessThanOrEqual(1280);
        expect(element.frame.y + element.frame.height, `${slide.id}.${element.id}: bottom`).toBeLessThanOrEqual(720);
        expect(element.accessibility.decorative || element.accessibility.label || element.accessibility.description, `${slide.id}.${element.id}: accessibility`).toBeTruthy();
      }
    }
  });

  it("preserves five verified team profiles and ten local assets", () => {
    expect(MYINTERVIEW_TEAM).toHaveLength(5);
    expect(myInterviewDefense.assets).toHaveLength(10);
    expect(myInterviewDefense.assets.every((asset) => asset.src.startsWith("/"))).toBe(true);
    const assetIds = new Set(myInterviewDefense.assets.map((asset) => asset.id));
    const imageAssetIds = myInterviewDefense.slides.flatMap((slide) => slide.elements.flatMap((element) =>
      element.kind === "image" ? [element.content.assetId] : []));
    expect(imageAssetIds.every((assetId) => assetIds.has(assetId))).toBe(true);
    expect(new Set(imageAssetIds.filter((assetId) => assetId.startsWith("team-"))).size).toBe(5);
  });

  it("uses a deliberate visual vocabulary instead of one repeated composition", () => {
    expect(new Set(MYINTERVIEW_SLIDES.map((slide) => slide.kind)).size).toBeGreaterThanOrEqual(10);
    const visibleKinds = new Set(myInterviewDefense.slides.flatMap((slide) => slide.elements.map((element) => element.kind)));
    for (const kind of ["shape", "text", "image", "table", "evidence-footer"] as const) {
      expect(visibleKinds.has(kind), `missing ${kind}`).toBe(true);
    }
    const portraitPositions = myInterviewDefense.slides
      .filter((slide) => slide.id.startsWith("member-"))
      .map((slide) => slide.elements.find((element) => element.id === "portrait")?.frame.x);
    expect(portraitPositions).toEqual([88, 868, 88, 868, 88]);
  });

  it("does not depend on the V1 schema or migration pipeline", () => {
    const packageDirectory = dirname(fileURLToPath(import.meta.url));
    const source = ["deck.ts", "content.ts", "visual-system.ts"]
      .map((file) => readFileSync(join(packageDirectory, file), "utf8"))
      .join("\n");
    expect(source).not.toMatch(/migrateDeckV1ToV2|DeckDocument(?!V2)|type Slide\b|defineDeck|getSlideMaster/);
    expect(source).not.toContain("myinterview-defense-v2");
  });

  it("keeps all material claims explicitly illustrative until independently verified", () => {
    const evidence = myInterviewDefense.visualIntelligence?.evidence;
    expect(evidence?.claims).toHaveLength(23);
    expect(evidence?.claims.every((claim) => claim.status === "illustrative")).toBe(true);
    expect(evidence?.sources[0]?.illustrativeLabel).toMatch(/chưa đại diện production/i);
  });
});
