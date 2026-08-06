import { expect, test, type Page } from "@playwright/test";
import { INTERACTION_BUDGETS } from "../../apps/present/lib/performance-budgets";

test.describe("Deckory V2 performance budgets", () => {
  test.setTimeout(90_000);

  test("keeps slide switching and overview responsive on the 23-slide defense deck", async ({ page }, testInfo) => {
    const runtime = watchRuntimeErrors(page);
    await page.goto("/present?deck=myinterview-defense-v2&view=presenter");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);

    const shell = page.locator('[data-scene-v2-surface="presenter"]');
    await expect(shell).toHaveAttribute("data-deck-slide-count", "23");

    const slideSwitchMs = await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const surface = document.querySelector<HTMLElement>('[data-scene-v2-surface="presenter"]');
      const next = document.querySelector<HTMLButtonElement>('button[aria-label="Slide tiếp theo"]');
      if (!surface || !next) {
        reject(new Error("Presenter performance controls are missing."));
        return;
      }
      const initialSlideId = surface.dataset.activeSlideId;
      const startedAt = performance.now();
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Slide switch did not complete within 2 seconds."));
      }, 2_000);
      const observer = new MutationObserver(() => {
        if (surface.dataset.activeSlideId === initialSlideId) return;
        requestAnimationFrame(() => {
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve(performance.now() - startedAt);
        });
      });
      observer.observe(surface, { attributes: true, attributeFilter: ["data-active-slide-id"] });
      next.click();
    }));

    const overviewOpenMs = await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Mở tổng quan slide"]');
      if (!trigger) {
        reject(new Error("Overview trigger is missing."));
        return;
      }
      const startedAt = performance.now();
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Overview did not open within 2 seconds."));
      }, 2_000);
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-v2-overview="true"]')) return;
        requestAnimationFrame(() => {
          window.clearTimeout(timeout);
          observer.disconnect();
          resolve(performance.now() - startedAt);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      trigger.click();
    }));

    const overview = page.locator('[data-v2-overview="true"]');
    await expect(overview).toBeVisible();
    await expect(overview.getByRole("button", { name: /^Mở slide / })).toHaveCount(23);

    await testInfo.attach("performance-metrics.json", {
      body: Buffer.from(JSON.stringify({ slideSwitchMs, overviewOpenMs }, null, 2)),
      contentType: "application/json"
    });
    console.log(`[deckory:performance-v2] slide-switch=${slideSwitchMs.toFixed(1)}ms overview-open=${overviewOpenMs.toFixed(1)}ms`);

    expect(slideSwitchMs).toBeLessThanOrEqual(INTERACTION_BUDGETS.slideSwitchMs);
    expect(overviewOpenMs).toBeLessThanOrEqual(INTERACTION_BUDGETS.overviewOpenMs);
    runtime.assertClean();
  });
});

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
