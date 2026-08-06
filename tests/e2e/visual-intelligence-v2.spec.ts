import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory V2 visual intelligence integration", () => {
  test("renders typed chart, diagram and evidence in Studio and Export", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/studio?deck=scene-foundation&slide=visual-proof");
    await expect(page.locator('[data-scene-v2-surface="studio"]')).toBeVisible();
    await expect(page.locator('[data-chart-status="ready"]')).toBeVisible();
    await expect(page.locator('[data-chart-variant="horizontal-bar"]')).toBeVisible();
    await expect(page.locator('rect[data-chart-datum-id="visual-hierarchy"][data-primary-highlight="true"]')).toBeVisible();
    await expect(page.getByText("Visual hierarchy", { exact: true })).toBeVisible();
    await expect(page.getByText("95", { exact: true })).toBeVisible();

    await expect(page.locator('[data-diagram-status="ready"]')).toBeVisible();
    await expect(page.locator('[data-diagram-node-id="document"]')).toBeVisible();
    await expect(page.locator('[data-diagram-node-id="validation"]')).toBeVisible();
    await expect(page.locator('[data-diagram-edge-id="document-validation"] polyline')).toHaveAttribute("points", "158,224 205,224");
    await expect(page.getByText("Deckory V2 local integration fixture", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Chọn Quality chart" }).click();
    const lineage = page.locator('[data-evidence-lineage="true"]');
    await expect(lineage).toBeVisible();
    await expect(lineage).toContainText("Visual hierarchy dẫn đầu fixture với 95 điểm");
    await expect(lineage).toContainText("Điểm chất lượng fixture · 3 rows · verified");
    await expect(lineage).toContainText("Deckory V2 local integration fixture · verified");
    await page.screenshot({ path: join(screenshotRoot, "visual-intelligence-studio.png"), animations: "disabled" });

    await page.goto("/export?deck=scene-foundation");
    const visualPage = page.locator('[data-export-slide-id="visual-proof"]');
    await expect(visualPage).toBeVisible();
    await expect(visualPage.locator('[data-chart-status="ready"]')).toBeVisible();
    await expect(visualPage.locator('[data-chart-motion="final"]')).toBeVisible();
    await expect(visualPage.locator('[data-diagram-status="ready"]')).toBeVisible();
    await expect(visualPage.getByText("Deckory V2 local integration fixture", { exact: true })).toBeVisible();
    await page.screenshot({ path: join(screenshotRoot, "visual-intelligence-export.png"), fullPage: true, animations: "disabled" });

    expect(runtimeErrors).toEqual([]);
  });

  test("converts boring process text to a native editable diagram and preserves undo", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/studio?deck=scene-foundation&slide=assistant-proof");
    await page.getByRole("button", { name: "Chọn Workflow source text" }).click();

    await expect(page.locator('[data-visual-intent="process"]')).toBeVisible();
    const recommendation = page.locator('[data-recommendation-id="linear-process"]');
    await expect(recommendation).toBeVisible();
    await expect(recommendation).toContainText("Nội dung có thứ tự thao tác rõ ràng");
    await expect(recommendation.getByRole("button", { name: "Visualize as native process" })).toBeEnabled();

    await recommendation.getByRole("button", { name: "Visualize as native process" }).click();
    await expect(page.locator('[data-diagram-status="ready"]')).toBeVisible();
    await expect(page.locator('[data-diagram-node-id="step-1"]')).toBeVisible();
    await expect(page.locator('[data-diagram-node-id="step-4"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Chọn Source · Workflow source text" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chọn Visual · Workflow source text" })).toBeVisible();
    await page.screenshot({ path: join(screenshotRoot, "text-to-visual-process.png"), animations: "disabled" });

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: "Chọn Workflow source text" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chọn Visual · Workflow source text" })).toHaveCount(0);
    await expect(page.locator('[data-diagram-node-id="step-1"]')).toHaveCount(0);

    expect(runtimeErrors).toEqual([]);
  });
});
