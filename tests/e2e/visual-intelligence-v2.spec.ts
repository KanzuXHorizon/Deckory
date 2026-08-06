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
});
