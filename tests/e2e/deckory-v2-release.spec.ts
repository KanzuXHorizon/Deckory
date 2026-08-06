import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory V2 release journey", () => {
  test.setTimeout(90_000);

  test("keeps the canonical defense deck editable, presentable and exportable on one production revision", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);

    await page.goto("/");
    const canonicalCard = page.locator('[data-v2-deck-id="myinterview-defense"]');
    await expect(canonicalCard).toBeVisible();
    await expect(canonicalCard).toContainText(/23 slide/i);
    await page.screenshot({ path: join(screenshotRoot, "release-hub-v2.png"), animations: "disabled" });

    await page.goto("/studio?deck=myinterview-defense&slide=cover");
    const title = page.locator('[data-studio-v2-canvas-stage="true"] [data-element-id="cover-title"]');
    await title.click();
    const before = await title.textContent();
    const editor = page.getByRole("textbox", { name: "Nội dung" });
    await editor.fill("AI Technical Interviewer · release candidate Scene V2.");
    await page.getByText(/Revision/).click();
    await expect(title).toContainText("AI Technical Interviewer · release candidate Scene V2.");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(title).toHaveText(before ?? "");
    await expect(page.locator('[data-export-capability-panel="true"]')).toContainText("PPTX");
    await page.screenshot({ path: join(screenshotRoot, "release-studio-v2.png"), animations: "disabled" });

    await page.goto("/present?deck=myinterview-defense&view=presenter");
    const presenter = page.locator('[data-scene-v2-surface="presenter"]');
    await expect(presenter).toHaveAttribute("data-deck-slide-count", "23");
    await page.getByRole("button", { name: "Mở ghi chú người thuyết trình" }).click();
    await expect(page.getByRole("complementary", { name: "Ghi chú người thuyết trình" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Mở tổng quan slide" }).click();
    const overview = page.locator('[data-v2-overview="true"]');
    await expect(overview.getByRole("button", { name: /^Mở slide / })).toHaveCount(23);
    await overview.getByRole("button", { name: /^Mở slide 2:/ }).click();
    await expect(presenter).toHaveAttribute("data-active-slide-id", "member-hao");
    await page.screenshot({ path: join(screenshotRoot, "release-presenter-v2.png"), animations: "disabled" });

    await page.goto("/present?deck=myinterview-defense&view=audience");
    await expect(page.getByRole("button", { name: "Mở ghi chú người thuyết trình" })).toHaveCount(0);
    await expect(page.getByText("Ghi chú người thuyết trình")).toHaveCount(0);

    await page.goto("/export?deck=myinterview-defense");
    await expect(page.locator('[data-export-deck-id="myinterview-defense"]')).toBeVisible();
    await expect(page.locator(".export-page")).toHaveCount(23);
    await expect(page.locator('[data-export-capability-report="true"]')).toBeVisible();
    await page.screenshot({ path: join(screenshotRoot, "release-export-v2.png"), animations: "disabled", fullPage: true });

    await page.goto("/preview?deck=echarts-v2-proof");
    await expect(page.locator('[data-chart-adapter="echarts-svg"]')).toHaveAttribute("data-chart-status", "ready");

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
