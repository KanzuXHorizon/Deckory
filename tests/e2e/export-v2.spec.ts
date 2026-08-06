import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const artifactRoot = join(process.cwd(), "output", "playwright", "exports", runId);
mkdirSync(artifactRoot, { recursive: true });

test.describe("Deckory V2 PNG and PDF export", () => {
  test.describe.configure({ timeout: 90_000 });
  test("renders Scene V2 in final export state without editor chrome", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/export?deck=scene-foundation");
    await waitForExport(page);

    const pages = page.locator(".export-page");
    await expect(pages).toHaveCount(3);
    await expect(page.locator('[data-export-capability-report="true"]')).toContainText("Báo cáo khả năng xuất");
    await expect(page.locator('.scene-slide[data-render-mode="export"]')).toHaveCount(3);
    await expect(page.locator('.scene-slide[data-motion-mode="export"]')).toHaveCount(3);
    await expect(page.locator('[data-chart-motion="final"]')).toBeVisible();
    await expect(page.getByText("Một scene graph dùng chung cho mọi bề mặt.")).toBeVisible();
    await expect(page.locator("[data-selection-label], [data-studio-v2-canvas-host], .speaker-note-copy")).toHaveCount(0);

    const pngPath = join(artifactRoot, "scene-foundation-cover.png");
    await captureSlide(page, pages.first(), pngPath);
    expect(readPngDimensions(pngPath)).toEqual({ width: 1280, height: 720 });

    const pdfPath = join(artifactRoot, "scene-foundation.pdf");
    const pdf = await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true, tagged: true });
    expect(countPdfPages(pdf)).toBe(3);

    runtime.assertClean();
  });

  test("uses the declared local fallback for Web Blocks and discloses unsupported output", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/export?deck=export-v2-proof");
    await waitForExport(page);

    const report = page.locator('[data-export-capability-report="true"]');
    await expect(report).toContainText("1 thành phần dùng fallback");
    await expect(report).toContainText("2 thành phần không hỗ trợ");
    await expect(report).toContainText("custom-radar-fallback");

    const fallback = page.locator('[data-web-block-status="static-export"]');
    await expect(fallback).toBeVisible();
    await expect(fallback.locator("img")).toHaveAttribute("src", /^data:image\/png;base64,/);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByText("Fallback phải được công bố trước khi xuất.")).toBeVisible();

    const pageBoundary = page.locator(".export-page");
    const pngPath = join(artifactRoot, "web-block-fallback.png");
    await captureSlide(page, pageBoundary, pngPath);
    expect(readPngDimensions(pngPath)).toEqual({ width: 1280, height: 720 });

    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    expect(countPdfPages(pdf)).toBe(1);

    runtime.assertClean();
  });
});

async function waitForExport(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-export-ready="true"]')).toBeVisible();
}

async function captureSlide(page: Page, slide: Locator, path: string): Promise<void> {
  await slide.scrollIntoViewIfNeeded();
  const box = await slide.boundingBox();
  expect(box).not.toBeNull();
  await page.screenshot({
    path,
    animations: "disabled",
    clip: {
      x: Math.round(box!.x),
      y: Math.round(box!.y),
      width: 1280,
      height: 720
    }
  });
}

function readPngDimensions(path: string): { width: number; height: number } {
  const png = readFileSync(path);
  if (png.toString("ascii", 1, 4) !== "PNG") throw new Error(`Không phải PNG hợp lệ: ${path}`);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function countPdfPages(pdf: Buffer): number {
  return [...pdf.toString("latin1").matchAll(/\/Type\s*\/Page\b/g)].length;
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
