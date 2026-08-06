import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CanvasGuides } from "./canvas-guides";

describe("CanvasGuides", () => {
  it("renders snap lines outside the artifact semantics", () => {
    const html = renderToStaticMarkup(<CanvasGuides
      matches={[
        { axis: "x", kind: "canvas-center-x", guideId: "canvas-center-x", target: "center", delta: 4, position: 640 },
        { axis: "y", kind: "text-baseline", guideId: "title-baseline", target: "start", delta: -2, position: 148 }
      ]}
      measurements={[{ axis: "horizontal", gap: 24, elementIds: ["a", "b", "c"] }]}
    />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-guide-axis="x"');
    expect(html).toContain('data-guide-axis="y"');
    expect(html).toContain("24 px");
    expect(html).toContain("Khoảng cách đều giữa 3 thành phần");
  });
});
