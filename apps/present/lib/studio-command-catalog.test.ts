import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import {
  filterStudioCommands,
  filterStudioSlides,
  normalizeStudioSearch,
  type StudioCommand
} from "./studio-command-catalog";

const commands: StudioCommand[] = [
  {
    id: "preview",
    label: "Xem trước",
    description: "Kiểm tra deck ở chế độ khán giả.",
    keywords: ["review", "audience"]
  },
  {
    id: "present",
    label: "Trình chiếu",
    description: "Mở Presenter toàn màn hình.",
    keywords: ["thuyết trình", "presentation"]
  },
  {
    id: "motion-replay",
    label: "Phát lại chuyển động",
    description: "Xem lại transition và reveal của slide.",
    keywords: ["animation", "motion", "chuyen dong"]
  }
];

const slides: Slide[] = [
  {
    id: "cover",
    layout: "cover",
    components: [
      { id: "heading", type: "heading", props: { title: "Mở đầu dự án" } }
    ]
  },
  {
    id: "architecture",
    layout: "architecture",
    components: [
      { id: "heading", type: "heading", props: { title: "Kiến trúc giữ một nguồn dữ liệu" } }
    ]
  }
];

describe("studio command catalog", () => {
  it("normalizes Vietnamese text without requiring diacritics", () => {
    expect(normalizeStudioSearch("  Chuyển Động  ")).toBe("chuyen dong");
    expect(normalizeStudioSearch("ĐỀ XUẤT")).toBe("de xuat");
  });

  it("matches commands by label, description and keyword", () => {
    expect(filterStudioCommands(commands, "trinh chieu")[0]?.id).toBe("present");
    expect(filterStudioCommands(commands, "audience")[0]?.id).toBe("preview");
    expect(filterStudioCommands(commands, "animation")[0]?.id).toBe("motion-replay");
  });

  it("ranks prefix matches before general substring matches", () => {
    const results = filterStudioCommands(commands, "trinh");
    expect(results[0]?.id).toBe("present");
  });

  it("matches slides by heading, id and layout", () => {
    expect(filterStudioSlides(slides, "kien truc").map((slide) => slide.id)).toEqual(["architecture"]);
    expect(filterStudioSlides(slides, "architecture").map((slide) => slide.id)).toEqual(["architecture"]);
    expect(filterStudioSlides(slides, "cover").map((slide) => slide.id)).toEqual(["cover"]);
  });

  it("returns all entries for an empty query", () => {
    expect(filterStudioCommands(commands, "")).toEqual(commands);
    expect(filterStudioSlides(slides, " ")).toEqual(slides);
  });
});
