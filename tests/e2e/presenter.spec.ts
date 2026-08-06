import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const e2ePort = process.env.DECKORY_E2E_PORT ?? "43217";
const e2eBaseURL = process.env.DECKORY_E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;
const e2eRunId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", e2eRunId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory production presentation surfaces", () => {
  test("renders the Hub and template gallery cover with stable production CSS", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);

    await page.goto("/");
    await waitForFonts(page);
    await expect(page.locator(".hub-shell")).toBeVisible();
    await expect(page.locator("#hub-title")).toHaveText(/Không gian làm việc cho những deck cần được tin cậy/i);
    await expect(page.locator('[data-deck-id="template-gallery"] h3')).toBeVisible();
    const v2Quality = page.locator('[data-v2-quality-summary="true"]');
    await expect(v2Quality).toBeVisible();
    await expect(v2Quality).toContainText("Quality gate V2 · 20 tiêu chí");
    await expect(v2Quality).toHaveAttribute("data-quality-state", "evidence-pending");
    await expect(v2Quality).toContainText("Chờ bằng chứng runtime/manual");
    await expectNoHorizontalOverflow(page);
    expect(await page.locator(".hub-workspace-intro").evaluate((element) => getComputedStyle(element).display)).toBe("grid");
    await page.screenshot({ path: join(screenshotRoot, "hub-template-library.png"), animations: "disabled" });

    await page.goto("/present?deck=template-gallery&slide=opening");
    await waitForFonts(page);
    await expect(page.locator('.presenter-stage-canvas .slide[data-slide-id="opening"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: /Deckory Template Intelligence/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectPresenterFitsViewport(page);
    await page.screenshot({ path: join(screenshotRoot, "gallery-cover-presenter.png") });

    runtime.assertClean();
  });

  test("keeps visual compositions inside the 16:9 safe canvas", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    const slideIds = ["catalog-coverage", "shared-contract", "comparison", "plan"];

    for (const slideId of slideIds) {
      await page.goto(`/present?deck=template-gallery&slide=${slideId}`);
      await waitForFonts(page);
      const slide = page.locator(`.presenter-stage-canvas .slide[data-slide-id="${slideId}"]`);
      await expect(slide).toBeVisible();
      await expectSlideSafeArea(slide);
      await page.screenshot({ path: join(screenshotRoot, `gallery-${slideId}.png`) });
    }

    runtime.assertClean();
  });

  test("reveals data in order without changing the requested slide", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/present?deck=template-gallery&slide=catalog-coverage");
    await waitForFonts(page);

    const chart = page.locator('.presenter-stage-canvas [data-component-id="chart"]');
    const insight = page.locator('.presenter-stage-canvas [data-component-id="insight"]');
    await expect(chart).toHaveAttribute("data-visible", "false");
    await expect(insight).toHaveAttribute("data-visible", "false");

    await page.keyboard.press("ArrowRight");
    await expect(chart).toHaveAttribute("data-visible", "true");
    await expect(insight).toHaveAttribute("data-visible", "false");
    await expect(page).toHaveURL(/slide=catalog-coverage/);

    await page.keyboard.press("ArrowRight");
    await expect(insight).toHaveAttribute("data-visible", "true");
    await page.screenshot({ path: join(screenshotRoot, "gallery-data-revealed.png") });

    runtime.assertClean();
  });

  test("traps focus in overview, blocks background shortcuts and restores focus", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/present?deck=template-gallery&slide=comparison");
    await waitForFonts(page);

    await expect(page.locator(".presenter-shell")).toBeVisible();
    const overviewButton = page.getByRole("button", { name: "Mở tổng quan slide" });
    await overviewButton.click();
    const dialog = page.getByRole("dialog", { name: /Chọn nơi bạn muốn tiếp tục/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[aria-current="page"]')).toBeFocused();
    const requestedUrl = page.url();

    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(requestedUrl);
    await expect(dialog).toBeVisible();

    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }

    await page.screenshot({ path: join(screenshotRoot, "gallery-overview-dialog.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(overviewButton).toBeFocused();

    runtime.assertClean();
  });

  test("synchronizes interactive team selection from presenter to audience", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: e2eBaseURL, viewport: { width: 1440, height: 900 } });
    const presenter = await context.newPage();
    const presenterRuntime = watchRuntimeErrors(presenter);

    await presenter.goto("/present?deck=visual-lab&slide=team-showcase");
    await waitForFonts(presenter);
    await presenter.keyboard.press("ArrowRight");

    const presenterMembers = presenter.locator(".presenter-stage-canvas .team-member");
    await expect(presenterMembers).toHaveCount(3);
    await expect(presenterMembers.nth(1)).toBeEnabled();
    await presenter.waitForTimeout(700);
    const selectedName = (await presenterMembers.nth(1).locator("strong").innerText()).trim();
    await presenterMembers.nth(1).click({ force: true });
    await expect(presenterMembers.nth(1)).toHaveClass(/is-selected/);

    const audience = await context.newPage();
    const audienceRuntime = watchRuntimeErrors(audience);
    await audience.goto("/present?deck=visual-lab&slide=team-showcase&view=audience");
    await waitForFonts(audience);
    await expect(audience.locator(".audience-stage .team-member.is-selected strong")).toHaveText(selectedName);
    await expect(audience.locator(".audience-stage .team-member-detail h3")).toHaveText(selectedName);

    presenterRuntime.assertClean();
    audienceRuntime.assertClean();
    await context.close();
  });

  test("synchronizes the laser pointer from presenter to audience", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: e2eBaseURL, viewport: { width: 1440, height: 900 } });
    const presenter = await context.newPage();
    const audience = await context.newPage();
    const presenterRuntime = watchRuntimeErrors(presenter);
    const audienceRuntime = watchRuntimeErrors(audience);

    await presenter.goto("/present?deck=visual-lab");
    await audience.goto("/present?deck=visual-lab&view=audience");
    await Promise.all([waitForFonts(presenter), waitForFonts(audience)]);

    await presenter.getByRole("button", { name: "Bật con trỏ laser" }).click();
    const stage = presenter.locator(".presenter-stage-canvas");
    const box = await stage.boundingBox();
    expect(box).toBeTruthy();
    await presenter.mouse.move(box!.x + box!.width * 0.7, box!.y + box!.height * 0.35);

    await expect(presenter.locator('[data-laser-visible="true"]')).toBeVisible();
    await expect(audience.locator('[data-laser-visible="true"]')).toBeVisible();
    await expect(presenter.getByRole("button", { name: "Tắt con trỏ laser" })).toBeVisible();

    presenterRuntime.assertClean();
    audienceRuntime.assertClean();
    await context.close();
  });

  test("keeps speaker notes private in audience view", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/present?deck=template-gallery&slide=shared-contract&view=audience");
    await waitForFonts(page);

    await expect(page.locator(".audience-shell")).toBeVisible();
    await expect(page.locator(".speaker-note-copy")).toHaveCount(0);
    await expect(page.getByText("GHI CHÚ NGƯỜI THUYẾT TRÌNH")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /toàn màn hình/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: join(screenshotRoot, "gallery-audience-architecture.png") });

    runtime.assertClean();
  });

  test("preserves reveal state with reduced motion and removes morph animation hooks", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: e2eBaseURL,
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce"
    });
    const page = await context.newPage();
    const runtime = watchRuntimeErrors(page);
    await page.goto("/present?deck=deckory-story&slide=data-story");
    await waitForFonts(page);

    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    const chart = page.locator('.presenter-stage-canvas [data-component-id="chart"]');
    await expect(chart).toHaveAttribute("data-visible", "false");
    await expect(page.locator('.presenter-stage-canvas [data-morph-id]')).toHaveCount(0);
    await page.keyboard.press("ArrowRight");
    await expect(chart).toHaveAttribute("data-visible", "true");
    await page.screenshot({ path: join(screenshotRoot, "reduced-motion-data-slide.png") });

    runtime.assertClean();
    await context.close();
  });

  test("uses vertical recovery without horizontal overflow at a 200 percent equivalent viewport", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto("/present?deck=template-gallery&slide=opening");
    await waitForFonts(page);

    const shellMetrics = await page.locator(".presenter-shell").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
    expect(shellMetrics.scrollWidth).toBeLessThanOrEqual(shellMetrics.clientWidth + 1);
    expect(shellMetrics.scrollHeight).toBeGreaterThanOrEqual(shellMetrics.clientHeight);
    await page.screenshot({ path: join(screenshotRoot, "presenter-200-percent-equivalent.png"), fullPage: true });

    runtime.assertClean();
  });
});

async function waitForFonts(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
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

async function expectPresenterFitsViewport(page: Page) {
  const metrics = await page.locator(".presenter-shell").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
}

async function expectSlideSafeArea(slide: ReturnType<Page["locator"]>) {
  const result = await slide.evaluate((element) => {
    const slideRect = element.getBoundingClientRect();
    const visibleSlots = [...element.querySelectorAll<HTMLElement>('.component-slot[data-visible="true"]')];
    return {
      ratio: slideRect.width / slideRect.height,
      violations: visibleSlots.flatMap((slot) => {
        const rect = slot.getBoundingClientRect();
        const outside = rect.left < slideRect.left - 1
          || rect.top < slideRect.top - 1
          || rect.right > slideRect.right + 1
          || rect.bottom > slideRect.bottom + 1;
        return outside ? [slot.dataset.componentId ?? slot.className] : [];
      })
    };
  });

  expect(result.ratio).toBeGreaterThan(1.76);
  expect(result.ratio).toBeLessThan(1.79);
  expect(result.violations).toEqual([]);
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
