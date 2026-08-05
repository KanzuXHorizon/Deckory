import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("MyInterview defense deck", () => {
  test("explains the scoring flow and keeps FPT branding visible", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=scoring-flow");
    await waitForFonts(page);

    const stage = page.locator(".presenter-stage-canvas");
    await expect(stage.locator('.slide[data-slide-id="scoring-flow"]')).toBeVisible();
    await expect(stage.getByText("CÁCH HÌNH THÀNH ĐIỂM")).toBeVisible();
    await expect(stage.getByText("Trích bằng chứng")).toBeVisible();
    await expect(stage.getByText("Đối chiếu rubric")).toBeVisible();
    await expect(stage.getByText("Kiểm tra độ tin cậy")).toBeVisible();

    const logo = stage.getByRole("img", { name: "FPT Polytechnic Đồng Nai – Cơ sở 2" });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/brand/fpt-polytechnic.svg");

    await page.screenshot({
      path: join(screenshotRoot, "myinterview-scoring-flow.png"),
      animations: "disabled"
    });
  });

  test("synchronizes scoring presets and custom weights to a read-only audience", async ({ page, context }) => {
    const audience = await context.newPage();
    await page.goto("/present?deck=myinterview-defense&slide=scoring-simulator");
    await audience.goto("/present?deck=myinterview-defense&slide=scoring-simulator&view=audience");
    await Promise.all([waitForFonts(page), waitForFonts(audience)]);

    await expect(page.locator('.presenter-stage-canvas .slide[data-slide-id="scoring-simulator"]')).toBeVisible();
    await expect(audience.locator('.audience-stage .slide[data-slide-id="scoring-simulator"]')).toBeVisible();
    await page.keyboard.press("ArrowRight");

    const presenterSimulator = page.locator('.presenter-stage-canvas [data-component-id="simulator"]');
    const audienceSimulator = audience.locator('.audience-stage [data-component-id="simulator"]');
    await expect(presenterSimulator).toHaveAttribute("data-visible", "true");
    await expect(audienceSimulator).toHaveAttribute("data-visible", "true");

    const presenterScore = presenterSimulator.locator(".weight-simulator__score strong");
    const initialScore = await presenterScore.textContent();
    await presenterSimulator.getByRole("button", { name: "Nhấn mạnh bằng chứng" }).click();
    await expect(presenterScore).not.toHaveText(initialScore ?? "");

    const audiencePreset = audienceSimulator.getByRole("button", { name: "Nhấn mạnh bằng chứng" });
    await expect(audiencePreset).toHaveAttribute("data-active", "true");
    await expect(audiencePreset).toBeDisabled();

    const presenterEvidence = presenterSimulator.getByRole("slider", { name: "Trọng số Bằng chứng" });
    await presenterEvidence.fill("30");
    const audienceEvidence = audienceSimulator.getByRole("slider", { name: "Trọng số Bằng chứng" });
    await expect(audienceEvidence).toHaveValue("30");
    await expect(audienceEvidence).toBeDisabled();
    await expect(audienceSimulator.locator(".weight-simulator")).toHaveAttribute("data-read-only", "true");

    await page.screenshot({
      path: join(screenshotRoot, "myinterview-scoring-simulator.png"),
      animations: "disabled"
    });
  });
});

async function waitForFonts(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
