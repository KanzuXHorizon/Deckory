import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("MyInterview defense deck", () => {
  test("deep-links to the verified architecture and keeps institutional evidence visible", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=architecture");
    await waitForFonts(page);

    const slide = page.locator('.presenter-stage-canvas .slide[data-slide-id="architecture"]');
    await expect(slide).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(slide.getByText("Next.js 16.2.11")).toBeVisible();
    await expect(slide.getByText("React 19.2.7")).toBeVisible();
    await expect(slide.getByText("TypeScript 6.0.3")).toBeVisible();
    await expect(slide.getByText("FastAPI 0.139.0")).toBeVisible();

    const logo = slide.getByRole("img", { name: "FPT Polytechnic Đồng Nai – Cơ sở 2" });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/brand/fpt-polytechnic.svg");

    await page.screenshot({ path: join(screenshotRoot, "myinterview-architecture.png"), animations: "disabled" });
  });

  test("renders verified member and product visuals from local assets", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=member-hao");
    await waitForFonts(page);
    await page.keyboard.press("ArrowRight");

    const memberSlide = page.locator('.presenter-stage-canvas .slide[data-slide-id="member-hao"]');
    const memberPhoto = memberSlide.getByRole("img", { name: "Ảnh thành viên Nguyễn Thái Hảo" });
    await expect(memberPhoto).toBeVisible();
    await expect(memberPhoto).toHaveAttribute("src", "/myinterview/team/hao.svg");

    await page.goto("/present?deck=myinterview-defense&slide=solution");
    await waitForFonts(page);
    await page.keyboard.press("ArrowRight");
    const solution = page.locator('.presenter-stage-canvas .slide[data-slide-id="solution"]');
    await expect(solution.locator(".media-card")).toHaveCount(2);
    await expect(solution.getByRole("img", { name: "Màn hình thiết lập phiên phỏng vấn MyInterview" })).toHaveAttribute("src", "/myinterview/product/setup.svg");
    await expect(solution.getByRole("img", { name: "Màn hình phản hồi và đánh giá MyInterview" })).toHaveAttribute("src", "/myinterview/product/feedback.svg");

    await page.screenshot({ path: join(screenshotRoot, "myinterview-product-evidence.png"), animations: "disabled" });
  });

  test("renders six explainable scoring criteria without overlap in presenter and preview", async ({ page, context }) => {
    const preview = await context.newPage();
    await page.goto("/present?deck=myinterview-defense&slide=ai-scoring");
    await preview.goto("/preview?deck=myinterview-defense&slide=ai-scoring");
    await Promise.all([waitForFonts(page), waitForFonts(preview)]);

    const presenterSlide = page.locator('.presenter-stage-canvas .slide[data-slide-id="ai-scoring"]');
    const previewSlide = preview.locator('.audience-stage .slide[data-slide-id="ai-scoring"]');
    await expect(presenterSlide).toBeVisible();
    await expect(previewSlide).toBeVisible();
    await page.keyboard.press("ArrowRight");

    const criteria = presenterSlide.locator(".criterion-card");
    await expect(criteria).toHaveCount(6);
    await expect(presenterSlide.getByText("Chiều sâu kỹ thuật")).toBeVisible();
    await expect(presenterSlide.getByText("Khoảng thiếu bằng chứng")).toBeVisible();
    await expect(preview.locator(".presenter-shell")).toHaveCount(0);

    const slideBox = await presenterSlide.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    });
    const boxes = await criteria.evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    }));
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(slideBox.left - 1);
      expect(box.top).toBeGreaterThanOrEqual(slideBox.top - 1);
      expect(box.right).toBeLessThanOrEqual(slideBox.right + 1);
      expect(box.bottom).toBeLessThanOrEqual(slideBox.bottom + 1);
    }
    for (let left = 0; left < boxes.length; left += 1) {
      for (let right = left + 1; right < boxes.length; right += 1) {
        const a = boxes[left]!;
        const b = boxes[right]!;
        const overlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
          * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        expect(overlap).toBe(0);
      }
    }

    await page.screenshot({ path: join(screenshotRoot, "myinterview-scoring-criteria.png"), animations: "disabled" });
    await preview.screenshot({ path: join(screenshotRoot, "myinterview-preview-scoring.png"), animations: "disabled" });
  });

  test("keeps responsible-AI boundaries and a three-step offline demo fallback", async ({ page }) => {
    await page.goto("/present?deck=myinterview-defense&slide=data-responsible-ai");
    await waitForFonts(page);
    await page.keyboard.press("ArrowRight");
    const responsible = page.locator('.presenter-stage-canvas .slide[data-slide-id="data-responsible-ai"]');
    await expect(responsible.getByText("Không tự động đỗ hoặc trượt")).toBeVisible();
    await expect(responsible.getByText("Không xếp hạng ứng viên")).toBeVisible();
    await expect(responsible.getByText("Không phân tích khuôn mặt hoặc cảm xúc")).toBeVisible();

    await page.goto("/present?deck=myinterview-defense&slide=demo");
    await waitForFonts(page);
    await page.keyboard.press("ArrowRight");
    const demo = page.locator('.presenter-stage-canvas .slide[data-slide-id="demo"]');
    await expect(demo.locator(".media-card")).toHaveCount(3);
    await expect(demo.getByRole("img", { name: "Phiên phỏng vấn văn bản MyInterview" })).toHaveAttribute("src", "/myinterview/product/interview.svg");
    await expect(demo.getByText("Khóa bối cảnh", { exact: true })).toBeVisible();
    await expect(demo.getByText("Trả lời theo lượt", { exact: true })).toBeVisible();
    await expect(demo.getByText("Biến đánh giá thành hành động", { exact: true })).toBeVisible();

    await page.screenshot({ path: join(screenshotRoot, "myinterview-demo-fallback.png"), animations: "disabled" });
  });

  test("shows MyInterview as the first ready deck in the hub", async ({ page }) => {
    await page.goto("/");
    await waitForFonts(page);
    const firstDeck = page.locator(".deck-card[data-deck-id]").first();
    await expect(firstDeck).toHaveAttribute("data-deck-id", "myinterview-defense");
    await expect(firstDeck.getByText("MyInterview — AI Technical Interviewer")).toBeVisible();
    await expect(firstDeck.getByText("Summer 2026")).toBeVisible();
  });
});

async function waitForFonts(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}
