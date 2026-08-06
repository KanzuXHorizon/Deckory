import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("MyInterview canonical Scene V2 defense deck", () => {
  test("shows one canonical card and no legacy deck-specific runtime path", async ({ page }) => {
    await page.goto("/");
    await waitForFonts(page);

    const canonical = page.locator('[data-v2-deck-id="myinterview-defense"]');
    await expect(canonical).toBeVisible();
    await expect(canonical).toContainText("MyInterview");
    await expect(canonical).toContainText("Canonical V2");
    await expect(page.locator('[data-v2-deck-id="myinterview-defense-v2"]')).toHaveCount(0);
    await expect(page.locator('.deck-card[data-deck-id="myinterview-defense"]')).toHaveCount(0);
    const legacyStyles = await page.evaluate(() => [...document.styleSheets].flatMap((sheet) => sheet.href?.includes("myinterview-defense.css") ? [sheet.href] : []));
    expect(legacyStyles).toEqual([]);
  });

  test("renders architecture and local people assets through native Scene V2 elements", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=architecture");
    await waitForFonts(page);

    const architecture = sceneSlide(page, "architecture");
    await expect(architecture).toBeVisible();
    await expect(architecture.locator('[data-element-id="layer-1-item-1"]')).toContainText("Next.js 16.2.11");
    await expect(architecture.locator('[data-element-id="layer-2-item-1"]')).toContainText("FastAPI 0.139.0");
    await expect(architecture.locator('[data-element-id="evidence-footer"]')).toContainText("FPT Polytechnic Đồng Nai");
    await expect(page.locator('.slide[data-deck-id="myinterview-defense"]')).toHaveCount(0);
    await assertInsideCanvas(architecture);
    await page.screenshot({ path: join(screenshotRoot, "myinterview-v2-architecture.png"), animations: "disabled" });

    await page.goto("/present?deck=myinterview-defense&slide=member-hao");
    await waitForFonts(page);
    const profile = sceneSlide(page, "member-hao");
    const portrait = profile.locator('[data-element-id="portrait"] img');
    await expect(portrait).toBeVisible();
    await expect(portrait).toHaveAttribute("src", "/myinterview/team/hao.svg");
    await expect(profile.locator('[data-element-id="profile-role"]')).toContainText("Trưởng nhóm");
    await assertInsideCanvas(profile);
  });

  test("keeps solution and six scoring criteria readable without overlap", async ({ page, context }) => {
    await page.goto("/present?deck=myinterview-defense&slide=solution");
    await waitForFonts(page);
    const solution = sceneSlide(page, "solution");
    await expect(solution.locator('[data-element-id="media-1-image"] img')).toHaveAttribute("src", "/myinterview/product/setup.svg");
    await expect(solution.locator('[data-element-id="media-2-image"] img')).toHaveAttribute("src", "/myinterview/product/feedback.svg");
    await expect(solution.locator('[data-element-id="media-2-surface"]')).toBeVisible();
    await assertInsideCanvas(solution);

    const preview = await context.newPage();
    await page.goto("/present?deck=myinterview-defense&slide=ai-scoring");
    await preview.goto("/preview?deck=myinterview-defense&slide=ai-scoring");
    await Promise.all([waitForFonts(page), waitForFonts(preview)]);
    const scoring = sceneSlide(page, "ai-scoring");
    await expect(scoring.locator('[data-element-id$="-label"]')).toHaveCount(6);
    await expect(scoring.locator('[data-element-id="criterion-4-label"]')).toContainText("Chiều sâu kỹ thuật");
    await expect(scoring.locator('[data-element-id="criterion-5-output"]')).toContainText("Khoảng thiếu bằng chứng");
    await assertNonOverlapping(scoring.locator('[data-element-id^="criterion-"][data-element-id$="-surface"]:not([data-element-id*="output"])'));
    await expect(preview.locator('[data-scene-v2-surface="preview"]')).toBeVisible();
    await page.screenshot({ path: join(screenshotRoot, "myinterview-v2-scoring.png"), animations: "disabled" });
  });

  test("keeps responsible-AI boundaries and the three-step demo visible in final state", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=data-responsible-ai");
    await waitForFonts(page);
    const responsible = sceneSlide(page, "data-responsible-ai");
    await expect(responsible.getByText("Không tự động đỗ hoặc trượt")).toBeVisible();
    await expect(responsible.getByText("Không xếp hạng ứng viên")).toBeVisible();
    await expect(responsible.getByText("Không phân tích khuôn mặt hoặc cảm xúc")).toBeVisible();

    await page.goto("/present?deck=myinterview-defense&slide=demo");
    await waitForFonts(page);
    const demo = sceneSlide(page, "demo");
    await expect(demo.locator('[data-element-id^="media-"][data-element-id$="-image"] img')).toHaveCount(3);
    await expect(demo.locator('[data-element-id="media-2-image"] img')).toHaveAttribute("src", "/myinterview/product/interview.svg");
    await expect(demo.getByText("Khóa bối cảnh", { exact: true })).toBeVisible();
    await expect(demo.getByText("Trả lời theo lượt", { exact: true })).toBeVisible();
    await expect(demo.getByText("Biến đánh giá thành hành động", { exact: true })).toBeVisible();
    await assertInsideCanvas(demo);
    await page.screenshot({ path: join(screenshotRoot, "myinterview-v2-demo.png"), animations: "disabled" });
  });

  test("keeps private notes out of audience and export DOM", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=cover&view=audience");
    await expect(page.getByText(/Nguyễn Thái Hảo mở đầu/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mở ghi chú người thuyết trình" })).toHaveCount(0);

    await page.goto("/export?deck=myinterview-defense");
    await expect(page.locator('[data-export-deck-id="myinterview-defense"]')).toBeVisible();
    await expect(page.locator(".export-page")).toHaveCount(23);
    await expect(page.getByText(/Nguyễn Thái Hảo mở đầu/)).toHaveCount(0);
    await expect(page.locator('.scene-slide[data-render-mode="export"]')).toHaveCount(23);
  });
});

function sceneSlide(page: Page, slideId: string): Locator {
  return page.locator(`.scene-slide[data-slide-id="${slideId}"]`);
}

async function assertInsideCanvas(slide: Locator): Promise<void> {
  const result = await slide.evaluate((node) => {
    const canvas = node.getBoundingClientRect();
    return [...node.querySelectorAll<HTMLElement>('.scene-element:not([style*="display: none"])')].flatMap((element) => {
      const box = element.getBoundingClientRect();
      const outside = box.left < canvas.left - 1 || box.top < canvas.top - 1 || box.right > canvas.right + 1 || box.bottom > canvas.bottom + 1;
      return outside ? [element.dataset.elementId ?? element.className] : [];
    });
  });
  expect(result).toEqual([]);
}

async function assertNonOverlapping(elements: Locator): Promise<void> {
  const boxes = await elements.evaluateAll((nodes) => nodes.map((node) => {
    const box = node.getBoundingClientRect();
    return { id: (node as HTMLElement).dataset.elementId, left: box.left, top: box.top, right: box.right, bottom: box.bottom };
  }));
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left]!;
      const b = boxes[right]!;
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      expect(width > 2 && height > 2, `${a.id} overlaps ${b.id}`).toBe(false);
    }
  }
}

async function waitForFonts(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
