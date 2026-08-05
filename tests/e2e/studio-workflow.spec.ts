import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

const draftKey = "deckory:draft:v1:deckory-story";
const snapshotKey = "deckory:snapshots:v1:deckory-story";

test.describe("Deckory Studio production workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(([draft, snapshots]) => {
      window.localStorage.removeItem(draft);
      window.localStorage.removeItem(snapshots);
    }, [draftKey, snapshotKey]);
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

  test("creates a named checkpoint and restores it as the current draft", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const title = page.getByRole("textbox", { name: "Tên deck" });
    const history = page.getByRole("button", { name: "Phiên bản", exact: true });
    await history.click();

    const snapshotName = page.getByRole("textbox", { name: "Tên checkpoint" });
    await expect(snapshotName).toBeFocused();
    await snapshotName.fill("Trước khi đổi tiêu đề");
    await page.getByRole("button", { name: "Tạo checkpoint" }).click();
    await expect(page.getByText("1 phiên bản")).toBeVisible();
    await expect(page.getByText("Trước khi đổi tiêu đề", { exact: true })).toBeVisible();

    await history.click();
    await title.fill("Deckory — tiêu đề sau checkpoint");
    await expect(page.locator(".studio-save-state")).toContainText("Đã lưu trên trình duyệt", { timeout: 5_000 });

    await history.click();
    const restore = page.getByRole("button", { name: "Khôi phục phiên bản Trước khi đổi tiêu đề" });
    await restore.click();
    const dialog = page.getByRole("dialog", { name: "Khôi phục phiên bản này?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Trước khi đổi tiêu đề");
    await dialog.getByRole("button", { name: "Khôi phục phiên bản", exact: true }).click();

    await expect(title).toHaveValue("Deckory — biến dữ liệu thành một câu chuyện rõ");
    await expect(page.getByRole("status")).toContainText("Đã khôi phục phiên bản");
    await history.click();
    await page.screenshot({ path: join(screenshotRoot, "studio-version-history.png"), animations: "disabled" });
    await history.click();
    const stored = await page.evaluate(([draft, snapshots]) => ({
      draft: JSON.parse(window.localStorage.getItem(draft) ?? "null"),
      snapshots: JSON.parse(window.localStorage.getItem(snapshots) ?? "[]")
    }), [draftKey, snapshotKey]);
    expect(stored.draft.title).toBe("Deckory — biến dữ liệu thành một câu chuyện rõ");
    expect(stored.snapshots).toHaveLength(1);

    await page.reload();
    await waitForReady(page);
    await expect(title).toHaveValue("Deckory — biến dữ liệu thành một câu chuyện rõ");
    await history.click();
    await expect(page.getByText("Trước khi đổi tiêu đề", { exact: true })).toBeVisible();
  });

  test("drops malformed local snapshot history without blocking Studio", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => window.localStorage.setItem(key, "{not-valid-json"), snapshotKey);

    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);
    await page.getByRole("button", { name: "Phiên bản" }).click();
    await expect(page.getByText("Chưa có checkpoint")).toBeVisible();
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), snapshotKey)).toBeNull();
  });

  test("falls back safely when the saved draft is malformed", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => window.localStorage.setItem(key, "{not-valid-json"), draftKey);

    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);
    await expect(page.getByRole("textbox", { name: "Tên deck" })).toHaveValue("Deckory — biến dữ liệu thành một câu chuyện rõ");
    await expect(page.getByRole("status")).toContainText("Không thể đọc bản nháp cục bộ");

    await page.goto("/preview?deck=deckory-story");
    await waitForReady(page);
    await expect(page.getByRole("status")).toContainText("Không thể đọc draft cục bộ");
    await expect(page.locator('[data-slide-id="cover"]')).toBeVisible();
  });

  test("keeps the in-memory edit and reports recovery guidance when storage is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (key.startsWith("deckory:draft:v1:")) throw new DOMException("Storage blocked", "SecurityError");
        return originalSetItem.call(this, key, value);
      };
    });

    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);
    const title = page.getByRole("textbox", { name: "Tên deck" });
    await title.fill("Deckory — phiên chỉnh sửa trong bộ nhớ");

    await expect(page.locator(".studio-save-state")).toContainText("Chưa thể lưu", { timeout: 5_000 });
    await expect(page.getByRole("status")).toContainText("Phiên chỉnh sửa hiện tại vẫn còn trong bộ nhớ");
    await expect(title).toHaveValue("Deckory — phiên chỉnh sửa trong bộ nhớ");
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
