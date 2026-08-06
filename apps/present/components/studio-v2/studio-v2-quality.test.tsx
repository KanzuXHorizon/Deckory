import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sceneFoundationDeck } from "../../lib/deck-catalog";
import { StudioV2 } from "./studio-v2";

describe("StudioV2 quality gate", () => {
  it("keeps the V2 score, readiness and pending runtime evidence visible in the Inspector", () => {
    const html = renderToStaticMarkup(<StudioV2 sourceDeck={sceneFoundationDeck} />);

    expect(html).toContain('data-v2-quality-summary="true"');
    expect(html).toContain("Quality gate V2 · 20 tiêu chí");
    expect(html).toContain("Chờ bằng chứng runtime/manual");
    expect(html).toContain('aria-label="Inspector"');
  });
});
