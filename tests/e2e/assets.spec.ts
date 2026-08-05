import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

const expectedSources = [
  "/team/avatar-product.svg",
  "/team/avatar-design.svg",
  "/team/avatar-engineering.svg"
];

test.describe("Deckory local asset pipeline", () => {
  test("resolves manifest asset IDs in export and loads every local image", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/export?deck=visual-lab");
    await waitForFonts(page);

    const teamSlide = page.locator('[data-export-slide-id="team-showcase"]');
    await expect(teamSlide).toBeVisible();
    const sources = await teamSlide.locator("img").evaluateAll((images) => images.map((image) => ({
      src: image.getAttribute("src"),
      naturalWidth: (image as HTMLImageElement).naturalWidth,
      naturalHeight: (image as HTMLImageElement).naturalHeight
    })));

    expect(new Set(sources.map((image) => image.src))).toEqual(new Set(expectedSources));
    expect(sources.every((image) => image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
    expect(sources.some((image) => image.src?.includes("avatar-product"))).toBe(true);

    await teamSlide.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(screenshotRoot, "asset-manifest-team-showcase.png"), animations: "disabled" });
    runtime.assertClean();
  });

  test("uses the same manifest in Studio thumbnails and canvas", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/studio?deck=visual-lab&slide=team-showcase");
    await waitForFonts(page);

    const canvas = page.locator('.studio-slide-canvas [data-slide-id="team-showcase"]');
    await expect(canvas).toBeVisible();
    const loadedImages = await canvas.locator("img").evaluateAll((images) => images.map((image) => ({
      src: image.getAttribute("src"),
      complete: (image as HTMLImageElement).complete,
      naturalWidth: (image as HTMLImageElement).naturalWidth
    })));

    expect(loadedImages.length).toBeGreaterThanOrEqual(3);
    expect(loadedImages.every((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(new Set(loadedImages.map((image) => image.src))).toEqual(new Set(expectedSources));
    runtime.assertClean();
  });
});

async function waitForFonts(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
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
