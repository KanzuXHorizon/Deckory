import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShapeRenderer } from "./shape-renderer";

describe("ShapeRenderer", () => {
  it("renders independent corner radii, gradients and dash patterns", () => {
    const html = renderToStaticMarkup(<ShapeRenderer spec={{
      id: "decision-shape",
      shape: "rectangle",
      width: 320,
      height: 180,
      fill: { type: "linear-gradient", angle: 120, stops: [{ offset: 0, color: "#5147e8" }, { offset: 1, color: "#0f8b8d" }] },
      stroke: { color: "#15171a", width: 2, dash: [8, 4] },
      cornerRadii: [12, 28, 4, 18],
      opacity: 0.94
    }} />);

    expect(html).toContain("border-radius:12px 28px 4px 18px");
    expect(html).toContain("linear-gradient(120deg");
    expect(html).toContain("8px 4px");
  });

  it("rejects effects outside the professional budget", () => {
    const html = renderToStaticMarkup(<ShapeRenderer spec={{
      id: "unsafe",
      shape: "ellipse",
      width: 200,
      height: 120,
      fill: { type: "solid", color: "#5147e8" },
      blur: 80,
      glow: { color: "#5147e8", blur: 120, opacity: 0.9 }
    }} />);

    expect(html).toContain('data-shape-error="effect-budget-exceeded"');
    expect(html).not.toContain("blur(80px)");
  });
});
