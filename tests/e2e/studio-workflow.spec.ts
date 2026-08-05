import { expect, test, type Page } from "@playwright/test";

const draftKey = "deckory:draft:v1:deckory-story";

test.describe("Deckory Studio production workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => window.localStorage.removeItem(key), draftKey);
  });

  test("autosaves a meaningful edit and restores it after reload", async ({ page }) => {
    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const title = page.getByRole("textbox", { name: "Tên deck" });
    await title.fill("Deckory — bản kiểm tra autosave");

    await expect(page.locator(".studio-save-state")).toContainText("Đã lưu trên trình duyệt", { timeout: 5_000 });
    const storedTitle = await page.evaluate((key) => {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored).title : null;
    }, draftKey);
    expect(storedTitle).toBe("Deckory — bản kiểm tra autosave");

    await page.reload();
    await waitForReady(page);
    await expect(title).toHaveValue("Deckory — bản kiểm tra autosave");
    await expect(page.getByRole("status")).toContainText("Đã khôi phục bản nháp");
  });

  test("protects destructive reset and slide deletion behind an accessible confirmation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const title = page.getByRole("textbox", { name: "Tên deck" });
    await title.fill("Deckory — thay đổi cần được bảo vệ");
    await expect(page.locator(".studio-save-state")).toContainText("Đã lưu trên trình duyệt", { timeout: 5_000 });

    const reset = page.getByRole("button", { name: "Khôi phục" });
    await reset.click();
    const resetDialog = page.getByRole("dialog", { name: "Khôi phục bản nguồn?" });
    await expect(resetDialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Hủy" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(resetDialog).toHaveCount(0);
    await expect(reset).toBeFocused();
    await expect(title).toHaveValue("Deckory — thay đổi cần được bảo vệ");

    await reset.click();
    await page.getByRole("button", { name: "Khôi phục bản nguồn" }).click();
    await expect(title).toHaveValue("Deckory — biến dữ liệu thành một câu chuyện rõ");
    await expect(page.getByRole("status")).toContainText("Đã khôi phục bản nguồn");
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), draftKey)).toBeNull();

    const slideItems = page.locator(".slide-rail-item");
    await expect(slideItems).toHaveCount(12);
    const deleteSlide = page.getByRole("button", { name: "Xoá slide" });
    await deleteSlide.click();
    const deleteDialog = page.getByRole("dialog", { name: "Xoá slide này?" });
    await expect(deleteDialog).toBeVisible();
    await page.getByRole("button", { name: "Xoá slide" }).last().click();
    await expect(slideItems).toHaveCount(11);
  });

  test("supports the complete keyboard pattern for Inspector tabs", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const inspectorTrigger = page.getByRole("button", { name: "Mở Inspector" });
    await inspectorTrigger.click();

    const content = page.getByRole("tab", { name: "Nội dung" });
    const slide = page.getByRole("tab", { name: "Slide" });
    const motion = page.getByRole("tab", { name: "Chuyển động" });
    const quality = page.getByRole("tab", { name: "Kiểm tra" });

    await expect(content).toHaveAttribute("aria-selected", "true");
    await expect(content).toHaveAttribute("tabindex", "0");
    await expect(slide).toHaveAttribute("tabindex", "-1");

    await content.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slide).toBeFocused();
    await expect(slide).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(quality).toBeFocused();
    await expect(quality).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(motion).toBeFocused();
    await expect(motion).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Home");
    await expect(content).toBeFocused();
    await expect(content).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Escape");
    await expect(page.locator("#studio-inspector")).toHaveAttribute("data-open", "false");
    await expect(inspectorTrigger).toBeFocused();
  });
});

async function waitForReady(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
