import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe("Deckory visual quality gate", () => {
  test("audits every deck exposed by the Hub across all exported slides", async ({ page }) => {
    const runtime = watchRuntimeErrors(page);
    const deckIds = await discoverDeckIds(page);
    expect(deckIds.length, "Hub must expose at least one deck").toBeGreaterThan(0);

    for (const deckId of deckIds) {
      await page.goto(`/export?deck=${deckId}`);
      await waitForFonts(page);
      await expect(page.locator('[data-export-ready="true"]')).toHaveAttribute("data-export-deck-id", deckId);

      const slides = page.locator(".export-page .slide, .export-page .scene-slide");
      const slideCount = await slides.count();
      expect(slideCount, `${deckId}: export must contain slides`).toBeGreaterThan(0);

      for (let index = 0; index < slideCount; index += 1) {
        const result = await inspectSlide(slides.nth(index));
        expect(result.ratio, `${deckId}/${result.slideId}: canvas ratio`).toBeGreaterThan(1.76);
        expect(result.ratio, `${deckId}/${result.slideId}: canvas ratio`).toBeLessThan(1.79);
        expect(result.outsideCanvas, `${deckId}/${result.slideId}: components outside canvas`).toEqual([]);
        expect(result.footerOverlaps, `${deckId}/${result.slideId}: footer overlaps content`).toEqual([]);
        expect(result.componentOverlaps, `${deckId}/${result.slideId}: visible components overlap`).toEqual([]);
        expect(result.contentOverflow, `${deckId}/${result.slideId}: visible content is clipped`).toEqual([]);
        expect(result.unexpectedFocusable, `${deckId}/${result.slideId}: static export contains active focus targets`).toEqual([]);
        expect(result.hiddenFocusable, `${deckId}/${result.slideId}: focus targets are hidden from assistive technology`).toEqual([]);
      }
    }

    runtime.assertClean();
  });
});

async function discoverDeckIds(page: Page): Promise<string[]> {
  await page.goto("/");
  await waitForFonts(page);
  const hrefs = await page.locator('a[href*="deck="]').evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).href)
  );
  const ids = hrefs.flatMap((href) => {
    try {
      const id = new URL(href).searchParams.get("deck");
      return id ? [id] : [];
    } catch {
      return [];
    }
  });
  return [...new Set(ids)].sort();
}

async function inspectSlide(slide: Locator) {
  return slide.evaluate((element) => {
    function rectanglesIntersect(left: DOMRect, right: DOMRect, tolerance: number) {
      const width = Math.min(left.right, right.right) - Math.max(left.left, right.left);
      const height = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
      return width > tolerance && height > tolerance;
    }
    const slideRect = element.getBoundingClientRect();
    const isSceneV2 = element.classList.contains("scene-slide");
    const isRendered = (node: HTMLElement) => {
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
    };
    const visibleSlots = isSceneV2
      ? [...element.querySelectorAll<HTMLElement>(".scene-element")].filter(isRendered)
      : [...element.querySelectorAll<HTMLElement>('.component-slot[data-visible="true"]')].filter(isRendered);
    const slotRecords = visibleSlots.map((slot) => ({
      id: isSceneV2 ? slot.dataset.elementId ?? slot.className : slot.dataset.componentId ?? slot.className,
      type: isSceneV2
        ? slot.dataset.elementKind ?? "unknown"
        : [...slot.classList].find((name) => name.startsWith("component-slot--"))?.replace("component-slot--", "") ?? "unknown",
      decorative: slot.getAttribute("aria-hidden") === "true",
      element: slot,
      rect: slot.getBoundingClientRect()
    }));
    const outsideCanvas = slotRecords.flatMap((slot) => {
      const outside = slot.rect.left < slideRect.left - 1
        || slot.rect.top < slideRect.top - 1
        || slot.rect.right > slideRect.right + 1
        || slot.rect.bottom > slideRect.bottom + 1;
      return outside ? [slot.id] : [];
    });

    const overlapRecords = isSceneV2
      ? slotRecords.filter((slot) => !slot.decorative && !["group", "stack", "grid", "shape", "line", "connector"].includes(slot.type))
      : slotRecords;
    const footer = overlapRecords.find((slot) => slot.type === "evidence-footer");
    const footerOverlaps = footer
      ? overlapRecords
        .filter((slot) => slot !== footer && rectanglesIntersect(footer.rect, slot.rect, 2))
        .map((slot) => slot.id)
      : [];

    const componentOverlaps: string[] = [];
    for (let leftIndex = 0; leftIndex < overlapRecords.length; leftIndex += 1) {
      const left = overlapRecords[leftIndex]!;
      if (left.type === "evidence-footer") continue;
      for (let rightIndex = leftIndex + 1; rightIndex < overlapRecords.length; rightIndex += 1) {
        const right = overlapRecords[rightIndex]!;
        if (right.type === "evidence-footer") continue;
        if (rectanglesIntersect(left.rect, right.rect, 3)) componentOverlaps.push(`${left.id} ↔ ${right.id}`);
      }
    }

    const contentOverflow = visibleSlots.flatMap((slot) => {
      const candidates = [slot, ...slot.querySelectorAll<HTMLElement>("*")];
      return candidates.flatMap((candidate) => {
        if (candidate.closest(".sr-only") || candidate.closest('[data-qa-allow-clip="true"]')) return [];
        if (candidate.getAttribute("aria-hidden") === "true" || ["svg", "path", "line", "rect", "circle", "polygon"].includes(candidate.tagName.toLowerCase())) return [];
        if (candidate.clientWidth <= 1 || candidate.clientHeight <= 1) return [];
        const style = getComputedStyle(candidate);
        const clipsX = style.overflowX === "hidden" || style.overflowX === "clip";
        const clipsY = style.overflowY === "hidden" || style.overflowY === "clip";
        const clipped = (clipsX && candidate.scrollWidth > candidate.clientWidth + 1)
          || (clipsY && candidate.scrollHeight > candidate.clientHeight + 1);
        if (!clipped) return [];
        const label = candidate.getAttribute("aria-label")
          ?? candidate.textContent?.trim().slice(0, 48)
          ?? candidate.tagName.toLowerCase();
        const ownerId = isSceneV2 ? slot.dataset.elementId : slot.dataset.componentId;
        return [`${ownerId ?? "unknown"}:${label}`];
      });
    });

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");
    const describeFocusable = (node: HTMLElement) => {
      const owner = node.closest<HTMLElement>(".component-slot, .scene-element");
      return `${owner?.dataset.componentId ?? owner?.dataset.elementId ?? "unknown"}:${node.tagName.toLowerCase()}`;
    };
    const unexpectedFocusable = [...element.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter(isRendered)
      .map(describeFocusable);
    const hiddenFocusable = [...element.querySelectorAll<HTMLElement>('[aria-hidden="true"]')]
      .flatMap((hiddenRoot) => [...hiddenRoot.querySelectorAll<HTMLElement>(focusableSelector)])
      .filter(isRendered)
      .map(describeFocusable);

    return {
      slideId: element.dataset.slideId ?? "unknown-slide",
      ratio: slideRect.width / slideRect.height,
      outsideCanvas,
      footerOverlaps,
      componentOverlaps,
      contentOverflow: [...new Set(contentOverflow)],
      unexpectedFocusable: [...new Set(unexpectedFocusable)],
      hiddenFocusable: [...new Set(hiddenFocusable)]
    };
  });
}

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
