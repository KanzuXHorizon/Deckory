import { expect, test, type Browser, type Page } from "@playwright/test";

const e2ePort = process.env.DECKORY_E2E_PORT ?? "43217";
const baseURL = process.env.DECKORY_E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

test.describe("Deckory mobile and coarse-pointer usability", () => {
  test("aligns the Studio inspector drawer with the tablet breakpoint", async ({ browser }) => {
    const page = await openTouchPage(browser, 1024, 768);

    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const toggle = page.getByRole("button", { name: "Mở Inspector" });
    const inspector = page.locator("#studio-inspector");
    await expect(toggle).toBeVisible();
    await expect(inspector).toHaveAttribute("data-open", "false");

    await toggle.click();
    await expect(inspector).toHaveAttribute("data-open", "true");
    await expect(inspector).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(inspector).toHaveAttribute("data-open", "false");
    await expect(toggle).toBeFocused();
    await expectNoHorizontalOverflow(page);

    await page.context().close();
  });

  test("keeps Studio save, preview and present actions reachable on narrow screens", async ({ browser }) => {
    const page = await openTouchPage(browser, 375, 812);

    await page.goto("/studio?deck=deckory-story");
    await waitForReady(page);

    const save = page.getByRole("button", { name: "Lưu ngay" });
    const preview = page.getByRole("link", { name: "Xem trước" });
    const present = page.getByRole("link", { name: "Trình chiếu" });

    await expect(save).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(present).toBeVisible();
    await expectTouchTarget(save);
    await expectTouchTarget(preview);
    await expectTouchTarget(present);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 320, height: 720 });
    await expect(save).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(present).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.context().close();
  });

  test("keeps Hub primary production actions touch-safe", async ({ browser }) => {
    const page = await openTouchPage(browser, 375, 812);

    await page.goto("/");
    await waitForReady(page);

    for (const control of [
      page.getByRole("link", { name: "Mở thư viện mẫu" }),
      page.getByRole("link", { name: "Mở deck" }),
      page.getByRole("link", { name: "Xem trước", exact: true }),
      page.getByRole("link", { name: "Trình chiếu", exact: true })
    ]) {
      await expect(control).toBeVisible();
      await expectTouchTarget(control);
    }
    await expectNoHorizontalOverflow(page);

    await page.context().close();
  });

  test("keeps Presenter utility controls touch-safe without exposing notes to audience", async ({ browser }) => {
    const page = await openTouchPage(browser, 375, 812);

    await page.goto("/present?deck=deckory-story");
    await waitForReady(page);

    const overview = page.getByRole("button", { name: "Mở tổng quan slide" });
    await expect(overview).toBeVisible();
    await expectTouchTarget(overview);
    await overview.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overview).toBeFocused();

    for (const control of [
      page.getByRole("button", { name: "Giảm cỡ chữ ghi chú" }),
      page.getByRole("button", { name: "Tăng cỡ chữ ghi chú" }),
      page.getByRole("button", { name: "Chạy đồng hồ" }),
      page.getByRole("button", { name: "Đặt lại đồng hồ" })
    ]) {
      await expect(control).toBeVisible();
      await expectTouchTarget(control);
    }

    await page.goto("/present?deck=deckory-story&view=audience");
    await waitForReady(page);
    await expect(page.locator(".speaker-note-copy")).toHaveCount(0);
    await page.locator(".audience-shell").tap({ position: { x: 24, y: 24 } });
    const fullscreen = page.getByRole("button", { name: /toàn màn hình/i });
    await expect(fullscreen).toBeVisible();
    await expectTouchTarget(fullscreen);
    await expectNoHorizontalOverflow(page);

    await page.context().close();
  });
});

async function openTouchPage(browser: Browser, width: number, height: number): Promise<Page> {
  const context = await browser.newContext({
    baseURL,
    viewport: { width, height },
    hasTouch: true,
    isMobile: true
  });
  return context.newPage();
}

async function waitForReady(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

async function expectTouchTarget(locator: ReturnType<Page["locator"]>) {
  const box = await locator.boundingBox();
  expect(box, "Control must have a rendered bounding box").not.toBeNull();
  expect(box!.width, "Touch target width").toBeGreaterThanOrEqual(44);
  expect(box!.height, "Touch target height").toBeGreaterThanOrEqual(44);
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}
