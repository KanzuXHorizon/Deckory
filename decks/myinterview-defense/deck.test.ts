import { describe, expect, it } from "vitest";
import { getSlideMaster } from "@deckory/templates";
import { myInterviewDefense } from "./deck";

const expectedSlideIds = [
  "cover",
  "member-hao",
  "member-minh",
  "member-quynh",
  "member-hoang",
  "member-thu",
  "topic",
  "current-state-gap",
  "solution",
  "architecture",
  "ai-scoring",
  "data-responsible-ai",
  "implementation",
  "testing-evidence",
  "limitations-roadmap",
  "conclusion",
  "demo",
  "appendix-backend",
  "appendix-state-machines",
  "appendix-rubric",
  "appendix-auth-data",
  "appendix-voice",
  "appendix-deployment-stack"
] as const;

describe("MyInterview graduation defense deck", () => {
  it("ships one complete 17-slide defense story plus six Q&A appendices", () => {
    expect(myInterviewDefense.slides.map((slide) => slide.id)).toEqual(expectedSlideIds);
    expect(myInterviewDefense.slides).toHaveLength(23);
  });

  it("keeps every slide presentation-ready with notes and traceable evidence", () => {
    for (const slide of myInterviewDefense.slides) {
      expect(slide.notes?.trim(), `${slide.id}: speaker notes`).toBeTruthy();
      expect(
        slide.components.some((component) => component.type === "evidence-footer"),
        `${slide.id}: evidence footer`
      ).toBe(true);
    }
  });

  it("uses verified local people and product visuals instead of placeholders", () => {
    const assetIds = new Set((myInterviewDefense.assets ?? []).map((asset) => asset.id));
    const memberImages = myInterviewDefense.slides
      .filter((slide) => slide.id.startsWith("member-"))
      .flatMap((slide) => slide.components)
      .filter((component) => component.type === "team-showcase")
      .flatMap((component) => component.props.members)
      .flatMap((member) => member.image ? [member.image.assetId] : [])
      .filter((assetId): assetId is string => Boolean(assetId));
    const productImages = myInterviewDefense.slides
      .flatMap((slide) => slide.components)
      .filter((component) => component.type === "media-showcase")
      .flatMap((component) => component.props.items.map((item) => item.assetId))
      .filter((assetId): assetId is string => Boolean(assetId));

    expect(new Set(memberImages).size).toBe(5);
    expect(memberImages.every((assetId) => assetIds.has(assetId))).toBe(true);
    expect(new Set(productImages).size).toBeGreaterThanOrEqual(4);
    expect(productImages.every((assetId) => assetIds.has(assetId))).toBe(true);
    expect((myInterviewDefense.assets ?? []).every((asset) => asset.src.startsWith("/"))).toBe(true);
  });

  it("assigns every slide to a compatible master and avoids three repeated composition families", () => {
    const families = myInterviewDefense.slides.map((slide) => {
      expect(slide.masterId, `${slide.id}: masterId`).toBeTruthy();
      const master = getSlideMaster(slide.masterId!);
      expect(master, `${slide.id}: known master`).toBeTruthy();
      expect(master?.layout, `${slide.id}: compatible master`).toBe(slide.layout);
      expect(slide.variant, `${slide.id}: master variant`).toBe(master?.variant);
      expect(slide.background, `${slide.id}: master background`).toBe(master?.background);
      expect(slide.transition, `${slide.id}: master transition`).toEqual(master?.transition);
      return master?.compositionFamily;
    });

    for (let index = 2; index < families.length; index += 1) {
      expect(
        families[index] === families[index - 1] && families[index] === families[index - 2],
        `slides ${index - 1}-${index + 1}: repeated composition family ${families[index]}`
      ).toBe(false);
    }
  });

  it("uses a semantic roadmap for the evidence-gated development path", () => {
    const slide = myInterviewDefense.slides.find((item) => item.id === "limitations-roadmap");
    const diagram = slide?.components.find((component) => component.type === "diagram");

    expect(slide?.layout).toBe("process");
    expect(diagram?.type).toBe("diagram");
    if (diagram?.type === "diagram") {
      expect(diagram.props.variant).toBe("roadmap");
      expect(diagram.props.summary.trim().length).toBeGreaterThan(30);
      expect(diagram.props.items).toHaveLength(4);
      expect(diagram.props.items.filter((item) => item.featured)).toHaveLength(1);
    }
  });

  it("does not present illustrative survey numbers or unsupported release claims as evidence", () => {
    const visibleDeckCopy = JSON.stringify(myInterviewDefense.slides);

    expect(visibleDeckCopy).not.toMatch(/KHẢO SÁT DỰ KIẾN|MINH HỌA|78%|71%|66%|61%/i);
    expect(visibleDeckCopy).not.toMatch(/hoàn thiện 100%|production-ready|sẵn sàng production/i);
    expect(visibleDeckCopy).toContain("Next.js 16.2.11");
    expect(visibleDeckCopy).toContain("React 19.2.7");
    expect(visibleDeckCopy).toContain("TypeScript 6.0.3");
    expect(visibleDeckCopy).toContain("FastAPI 0.139.0");
  });
});
