import type { Slide, SlideComponent } from "@deckory/schema";
import { slideMasters } from "./catalog/masters";
import type {
  SlideCompositionFamily,
  SlideMasterPreset,
  SlideMasterRecommendation,
  VisualStylePreset
} from "./types";

const slideMasterById = new Map<string, SlideMasterPreset>(slideMasters.map((master) => [master.id, master]));

export function getSlideMaster(id: string): SlideMasterPreset | undefined {
  return slideMasterById.get(id);
}

export function compatibleSlideMasters(
  slide: Pick<Slide, "layout">,
  masters: readonly SlideMasterPreset[] = slideMasters
): SlideMasterPreset[] {
  return masters.filter((master) => master.layout === slide.layout);
}

export function recommendSlideMaster({
  slide,
  previousSlides = [],
  style,
  masters = slideMasters
}: {
  slide: Slide;
  previousSlides?: readonly Slide[];
  style?: VisualStylePreset;
  masters?: readonly SlideMasterPreset[];
}): SlideMasterRecommendation | undefined {
  const candidates = compatibleSlideMasters(slide, masters);
  if (candidates.length === 0) return undefined;

  const componentTypes = new Set<SlideComponent["type"]>(slide.components.map((component) => component.type));
  const recentFamilies = previousSlides
    .slice(-2)
    .reverse()
    .map((previous) => previous.masterId ? getSlideMaster(previous.masterId)?.compositionFamily : undefined)
    .filter((family): family is SlideCompositionFamily => family !== undefined);

  const ranked = candidates.map((master) => scoreMaster(master, slide, componentTypes, recentFamilies, style));
  ranked.sort((left, right) => right.score - left.score || left.master.id.localeCompare(right.master.id));
  return ranked[0];
}

function scoreMaster(
  master: SlideMasterPreset,
  slide: Slide,
  componentTypes: ReadonlySet<SlideComponent["type"]>,
  recentFamilies: readonly SlideCompositionFamily[],
  style: VisualStylePreset | undefined
): SlideMasterRecommendation {
  let score = 50;
  const reasons: string[] = ["Tương thích với layout semantic hiện tại."];
  const componentCount = slide.components.length;
  const hasData = componentTypes.has("chart") || componentTypes.has("table") || componentTypes.has("metric-grid");
  const hasEvidence = componentTypes.has("evidence-footer");
  const hasMedia = componentTypes.has("media-showcase") || componentTypes.has("team-showcase");
  const hasSystem = componentTypes.has("architecture") || componentTypes.has("code") || componentTypes.has("visualizer");
  const hasFlow = componentTypes.has("process") || componentTypes.has("visualizer");

  if (hasData && master.compositionFamily === "evidence") {
    score += 24;
    reasons.push("Ưu tiên evidence composition vì slide có dữ liệu định lượng.");
  }
  if (hasEvidence && master.compositionFamily === "evidence") {
    score += 10;
    reasons.push("Giữ nguồn và kết luận trong cùng một trường nhìn.");
  }
  if (hasMedia && master.compositionFamily === "gallery") {
    score += 25;
    reasons.push("Đưa asset thật thành điểm nhìn chính thay vì trang trí phụ.");
  }
  if (hasSystem && master.compositionFamily === "system") {
    score += 20;
    reasons.push("Bố cục system phù hợp với boundary, code hoặc kiến trúc.");
  }
  if (hasFlow && master.compositionFamily === "flow") {
    score += 18;
    reasons.push("Bố cục flow làm rõ thứ tự và chuyển trạng thái.");
  }

  const expectedDensity = componentCount <= 2 ? "sparse" : componentCount >= 5 ? "dense" : "balanced";
  if (master.density === expectedDensity) {
    score += 9;
    reasons.push(`Mật độ ${master.density} khớp với ${componentCount} thành phần.`);
  }

  if (style) {
    if (style.dials.evidenceRigor >= 8 && master.compositionFamily === "evidence") score += 6;
    if (style.dials.narrativeVariance >= 8 && ["asymmetric", "cinematic", "gallery"].includes(master.compositionFamily)) score += 5;
    if (style.dials.motionIntensity <= 4 && ["editorial", "evidence", "system"].includes(master.compositionFamily)) score += 4;
  }

  recentFamilies.forEach((family, index) => {
    if (family !== master.compositionFamily) return;
    const deduction = index === 0 ? 42 : 24;
    score -= deduction;
    reasons.push("Giảm điểm để tránh lặp composition family ở các slide liền kề.");
  });

  if (slide.masterId === master.id) score -= 4;

  return { master, reasons, score };
}
