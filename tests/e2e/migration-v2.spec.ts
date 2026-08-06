import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory V2 reference deck migrations", () => {
  test.describe.configure({ timeout: 90_000 });

  test("keeps MyInterview V2 visible and usable across all production surfaces", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);

    await page.goto("/");
    const hubCard = page.locator('[data-v2-deck-id="myinterview-defense-v2"]');
    await expect(hubCard).toBeVisible();
    await expect(hubCard).toContainText("MyInterview");
    await expect(hubCard).toContainText("23 SLIDE");
    await expect(hubCard).toContainText("runtime pending");
    await expect(hubCard.getByRole("link", { name: "Studio" })).toHaveAttribute("href", "/studio?deck=myinterview-defense-v2");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: join(screenshotRoot, "hub-v2-migrations.png"), fullPage: true, animations: "disabled" });

    await page.goto("/preview?deck=myinterview-defense-v2&slide=cover");
    await expect(page.locator('[data-scene-v2-surface="preview"]')).toBeVisible();
    await expect(page.locator('.scene-slide[data-slide-id="cover"]')).toBeVisible();
    await expect(page.getByText(/MyInterview/i).first()).toBeVisible();
    await page.screenshot({ path: join(screenshotRoot, "myinterview-v2-preview-cover.png"), animations: "disabled" });

    await page.goto("/present?deck=myinterview-defense-v2&slide=cover");
    await expect(page.locator('[data-scene-v2-surface="presenter"]')).toBeVisible();
    await expect(page.locator('.scene-slide[data-slide-id="cover"]')).toBeVisible();
    await expect(page.locator(".speaker-note-copy")).toHaveCount(0);

    await page.goto("/studio?deck=myinterview-defense-v2&slide=cover");
    await expect(page.locator('[data-scene-v2-surface="studio"]')).toBeVisible();
    await expect(page.locator('[data-v2-quality-summary="true"]')).toBeVisible();
    await expect(page.locator('[data-export-capability-panel="true"]')).toBeVisible();
    await expect(page.getByText(/23/).first()).toBeVisible();

    await page.goto("/export?deck=myinterview-defense-v2");
    await expect(page.locator('[data-export-deck-id="myinterview-defense-v2"]')).toBeVisible();
    await expect(page.locator(".export-page")).toHaveCount(23);
    await expect(page.locator('.scene-slide[data-render-mode="export"]')).toHaveCount(23);
    await expect(page.locator('[data-export-capability-report="true"]')).toBeVisible();

    runtime.assertClean();
  });
});

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

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
