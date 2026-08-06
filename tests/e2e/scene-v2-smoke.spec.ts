import { expect, test } from "@playwright/test";

const e2ePort = process.env.DECKORY_E2E_PORT ?? "43217";
const e2eBaseURL = process.env.DECKORY_E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

test.describe("Deckory V2 scene foundation", () => {
  test("renders V1 and V2 decks across Preview, Presenter, Studio and Export", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(`${e2eBaseURL}/preview?deck=scene-foundation`);
    await expect(page.locator('[data-scene-v2-surface="preview"]')).toBeVisible();
    await expect(page.locator('[data-element-id="title"]')).toContainText("Một scene graph dùng chung");

    await page.goto(`${e2eBaseURL}/present?deck=scene-foundation`);
    await expect(page.locator('[data-scene-v2-surface="presenter"]')).toBeVisible();
    await expect(page.locator('.scene-slide[data-slide-id="cover"]')).toBeVisible();

    await page.goto(`${e2eBaseURL}/studio?deck=scene-foundation`);
    await expect(page.locator('[data-scene-v2-surface="studio"]')).toBeVisible();
    await expect(page.getByText(/Direct manipulation được triển khai trong Plan 02/i)).toBeVisible();

    await page.goto(`${e2eBaseURL}/export?deck=scene-foundation`);
    await expect(page.locator('[data-export-deck-id="scene-foundation"]')).toBeVisible();
    await expect(page.locator('.export-page .scene-slide')).toBeVisible();

    await page.goto(`${e2eBaseURL}/present?deck=visual-lab`);
    await expect(page.locator('.presenter-shell .slide[data-slide-id="cover"]')).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });
});
