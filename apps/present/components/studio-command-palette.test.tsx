import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Slide } from "@deckory/schema";
import type { StudioCommand } from "../lib/studio-command-catalog";
import { StudioCommandPalette } from "./studio-command-palette";

const commands: StudioCommand[] = [
  {
    id: "save",
    label: "Lưu ngay",
    description: "Lưu bản nháp trên trình duyệt này.",
    keywords: ["save"]
  },
  {
    id: "undo",
    label: "Hoàn tác",
    description: "Quay lại thay đổi trước.",
    keywords: ["undo"],
    disabled: true,
    disabledReason: "Chưa có thay đổi để hoàn tác."
  }
];

const slides: Slide[] = [
  {
    id: "architecture",
    layout: "architecture",
    components: [
      { id: "heading", type: "heading", props: { title: "Một nguồn dữ liệu cho mọi bề mặt" } }
    ]
  }
];

describe("StudioCommandPalette", () => {
  it("does not render when closed", () => {
    const html = renderToStaticMarkup(
      <StudioCommandPalette
        open={false}
        commands={commands}
        slides={slides}
        onOpenChange={() => undefined}
        onCommand={() => undefined}
        onSelectSlide={() => undefined}
      />
    );

    expect(html).toBe("");
  });

  it("renders accessible command and slide results", () => {
    const html = renderToStaticMarkup(
      <StudioCommandPalette
        open
        commands={commands}
        slides={slides}
        onOpenChange={() => undefined}
        onCommand={() => undefined}
        onSelectSlide={() => undefined}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Tìm lệnh hoặc slide"');
    expect(html).toContain("Lưu ngay");
    expect(html).toContain("Hoàn tác");
    expect(html).toContain("Chưa có thay đổi để hoàn tác.");
    expect(html).toContain("Một nguồn dữ liệu cho mọi bề mặt");
    expect(html).toContain("KIẾN TRÚC");
    expect(html).toContain("disabled");
  });
});
