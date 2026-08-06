import { expect, test, type Page } from "@playwright/test";

test.describe("Deckory V2 advanced chart lazy boundary", () => {
  test("loads ECharts SVG only for an advanced chart and keeps export ready", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);

    await page.goto("/preview?deck=echarts-v2-proof");
    await expect(page.locator('[data-scene-v2-surface="preview"]')).toHaveAttribute("data-active-slide-id", "scatter-proof");
    const previewChart = page.locator('[data-chart-adapter="echarts-svg"][data-chart-variant="scatter"]');
    await expect(previewChart).toHaveAttribute("data-chart-status", "ready");
    await expect(previewChart.locator("svg")).toBeVisible();
    await expect(previewChart).toHaveAttribute("aria-label", /Phương án cân bằng/);

    await page.goto("/export?deck=echarts-v2-proof");
    await expect(page.locator('[data-export-deck-id="echarts-v2-proof"]')).toBeVisible();
    const exportChart = page.locator('[data-chart-adapter="echarts-svg"][data-chart-variant="scatter"]');
    await expect(exportChart).toHaveAttribute("data-chart-status", "ready");
    await expect(exportChart).toHaveAttribute("data-chart-motion", "final");
    await expect(exportChart.locator("svg")).toBeVisible();

    runtime.assertClean();
  });
});

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  return {
    assertClean() {
      expect(errors, "Browser console/page errors").toEqual([]);
      expect(failedResponses, "HTTP responses >= 400").toEqual([]);
    }
  };
}
