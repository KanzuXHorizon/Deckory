import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("MyInterview defense deck", () => {
  test("updates the illustrative weighted score when a presenter changes the emphasis", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=scoring-simulator");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    await page.keyboard.press("ArrowRight");
    const simulator = page.locator('.presenter-stage-canvas [data-component-id="simulator"]');
    await expect(simulator).toHaveAttribute("data-visible", "true");

    const score = simulator.locator(".weight-simulator__score strong");
    const rubricScore = await score.textContent();
    await simulator.getByRole("button", { name: "Nhấn mạnh bằng chứng" }).click();
    await expect(score).not.toHaveText(rubricScore ?? "");

    const evidenceSlider = simulator.getByRole("slider", { name: "Trọng số Bằng chứng" });
    await evidenceSlider.focus();
    await page.keyboard.press("Home");
    await expect(simulator.locator(".weight-simulator__score small")).toContainText("Tổng trọng số");

    await page.screenshot({
      path: join(screenshotRoot, "myinterview-scoring-simulator.png"),
      animations: "disabled"
    });
  });
});
