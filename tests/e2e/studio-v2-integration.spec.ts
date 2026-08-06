import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory V2 Studio integration", () => {
  test("edits the Scene Foundation through one command history", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.goto("/studio?deck=scene-foundation");
    await expect(page.locator('[data-scene-v2-surface="studio"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Layers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Layout" })).toBeHidden();

    const canvas = page.locator('[data-studio-v2-canvas-host="true"]');
    const title = page.locator('[data-studio-v2-canvas-stage="true"] [data-element-id="title"]');
    await expect(canvas).toBeVisible();
    await expect(title).toBeVisible();

    await title.click();
    await expect(page.getByRole("heading", { name: "Title" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Layout" })).toBeVisible();
    await expect(page.locator('[data-selection-label="Title"]')).toBeVisible();

    const beforeLeft = await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).left));
    await canvas.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).left))).toBe(beforeLeft + 1);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).left))).toBe(beforeLeft);

    const beforeTop = await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).top));
    const renderedScale = await title.evaluate((element) => element.getBoundingClientRect().width / Number.parseFloat(getComputedStyle(element).width));
    const bounds = await title.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bounds!.x + bounds!.width / 2 + 20 * renderedScale,
      bounds!.y + bounds!.height / 2 + 10 * renderedScale,
      { steps: 4 }
    );
    await page.mouse.up();
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).left))).toBe(beforeLeft + 20);
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).top))).toBe(beforeTop + 10);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).left))).toBe(beforeLeft);
    await expect.poll(async () => title.evaluate((element) => Number.parseFloat(getComputedStyle(element).top))).toBe(beforeTop);

    const editor = page.getByRole("textbox", { name: "Nội dung" });
    await editor.fill("Scene graph được chỉnh trực tiếp trong Studio.");
    await page.getByText(/Revision/).click();
    await expect(title).toContainText("Scene graph được chỉnh trực tiếp trong Studio.");

    await page.getByRole("button", { name: "Khóa Title" }).click();
    await expect(title).toHaveAttribute("data-locked", "true");
    await page.getByRole("button", { name: "Mở khóa Title" }).click();
    await expect(title).not.toHaveAttribute("data-locked", "true");

    await page.screenshot({ path: join(screenshotRoot, "studio-v2-integrated.png"), animations: "disabled" });
    expect(runtimeErrors).toEqual([]);
  });
});
