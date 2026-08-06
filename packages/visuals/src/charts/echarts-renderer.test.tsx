import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { advancedChartFixtures, localGeoFixture } from "./advanced-fixtures";
import { EChartsSvgRenderer, renderEChartsSvg } from "./echarts-renderer";

describe("EChartsSvgRenderer", () => {
  it("renders deterministic server-side SVG for an advanced chart", () => {
    const input = {
      spec: advancedChartFixtures.scatter,
      width: 640,
      height: 360,
      mode: "export" as const
    };
    const first = renderEChartsSvg(input);
    const second = renderEChartsSvg(input);

    expect(first).toBe(second);
    expect(first).toContain("<svg");
    expect(first).not.toMatch(/zr\d+/);
    expect(first).not.toMatch(/(?:href|src)="https?:\/\//i);
  });

  it("exposes accessible ready state and final motion in thumbnail mode", () => {
    const html = renderToStaticMarkup(
      <EChartsSvgRenderer
        spec={advancedChartFixtures.donut}
        width={640}
        height={360}
        mode="thumbnail"
      />
    );
    expect(html).toContain('data-chart-status="ready"');
    expect(html).toContain('data-chart-adapter="echarts-svg"');
    expect(html).toContain('data-chart-motion="final"');
    expect(html).toContain('aria-label="Dữ liệu minh hoạ cho advanced chart adapter."');
    expect(html).toContain("<svg");
  });

  it("renders geographic charts only from the declared local asset", () => {
    const svg = renderEChartsSvg({
      spec: advancedChartFixtures.choropleth,
      width: 640,
      height: 360,
      mode: "export",
      localGeoAsset: { id: "local-geo", data: localGeoFixture }
    });
    expect(svg).toContain("<svg");
    expect(svg).not.toMatch(/(?:href|src)="https?:\/\//i);
  });

  it("returns an explicit adapter error when a geographic asset is missing", () => {
    const html = renderToStaticMarkup(
      <EChartsSvgRenderer
        spec={advancedChartFixtures.choropleth}
        width={640}
        height={360}
        mode="final"
      />
    );
    expect(html).toContain('data-chart-status="adapter-error"');
    expect(html).toContain("local geographic asset");
  });
});
