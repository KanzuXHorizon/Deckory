import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const screenshotRoot = join(process.cwd(), "output", "playwright", "screenshots", runId);
mkdirSync(screenshotRoot, { recursive: true });

test.describe("Deckory export surface", () => {
  test.describe.configure({ timeout: 90_000 });
  test("renders every slide with the shared renderer and print-safe dimensions", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/export?deck=template-gallery");
    await waitForFonts(page);

    const shell = page.locator('[data-export-ready="true"]');
    await expect(shell).toHaveAttribute("data-export-deck-id", "template-gallery");
    await expect(page.getByRole("button", { name: "In hoặc lưu deck thành PDF" })).toBeVisible();

    const pages = page.locator(".export-page");
    await expect(pages).toHaveCount(9);
    await expect(page.locator(".speaker-note-copy")).toHaveCount(0);
    await expect(page.getByText("GHI CHÚ NGƯỜI THUYẾT TRÌNH")).toHaveCount(0);

    for (let index = 0; index < 9; index += 1) {
      const metrics = await pages.nth(index).evaluate((element) => {
        const pageRect = element.getBoundingClientRect();
        const slide = element.querySelector<HTMLElement>(".slide");
        const slideRect = slide?.getBoundingClientRect();
        const violations = [...element.querySelectorAll<HTMLElement>('.component-slot[data-visible="true"]')]
          .flatMap((slot) => {
            const rect = slot.getBoundingClientRect();
            const outside = rect.left < pageRect.left - 1
              || rect.top < pageRect.top - 1
              || rect.right > pageRect.right + 1
              || rect.bottom > pageRect.bottom + 1;
            return outside ? [slot.dataset.componentId ?? slot.className] : [];
          });

        return {
          width: pageRect.width,
          height: pageRect.height,
          slideWidth: slideRect?.width ?? 0,
          slideHeight: slideRect?.height ?? 0,
          violations
        };
      });

      expect(metrics).toEqual({
        width: 1280,
        height: 720,
        slideWidth: 1280,
        slideHeight: 720,
        violations: []
      });
    }

    await pages.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(screenshotRoot, "export-template-gallery.png"), animations: "disabled" });

    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".export-toolbar")).toBeHidden();
    const printMetrics = await pages.first().evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(printMetrics.width).toBeCloseTo(1280, 0);
    expect(printMetrics.height).toBeCloseTo(720, 0);

    runtime.assertClean();
  });

  test("copies explicit offline export commands and keeps the format panel responsive", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 680, height: 900 });
    await page.goto("/export?deck=deckory-story");
    await waitForFonts(page);

    const panel = page.locator(".export-format-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("mở terminal tại thư mục Deckory");
    await panel.getByRole("button", { name: /^PNG\b/ }).click();
    await expect(panel.getByRole("status")).toContainText("Đã sao chép lệnh PNG");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
      "pnpm export:deck -- --deck=deckory-story --format=png"
    );

    const overflow = await panel.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("returns not found for an unknown deck instead of exporting the default deck", async ({ page }) => {
    const response = await page.goto("/export?deck=unknown-deck");
    expect(response?.status()).toBe(404);
    await expect(page.locator('[data-export-ready="true"]')).toHaveCount(0);
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
