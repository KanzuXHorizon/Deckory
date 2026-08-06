import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SceneElement } from "@deckory/schema/v2";
import { LayersPanel } from "./layers-panel";

const elements: SceneElement[] = [
  { id: "group", name: "Nhóm nội dung", kind: "group", frame: { x: 40, y: 40, width: 400, height: 300 }, zIndex: 1, content: { children: ["title"] }, accessibility: { label: "Nhóm nội dung" } },
  { id: "title", name: "Tiêu đề", kind: "text", parentId: "group", frame: { x: 20, y: 20, width: 300, height: 80 }, zIndex: 2, locked: true, content: { text: "Deckory" }, accessibility: { label: "Deckory" } }
];

describe("LayersPanel", () => {
  it("renders an accessible hierarchical tree with Vietnamese actions", () => {
    const html = renderToStaticMarkup(<LayersPanel
      elements={elements}
      selectedIds={["title"]}
      primaryId="title"
      searchQuery=""
      onSelect={() => undefined}
      onPatch={() => undefined}
    />);

    expect(html).toContain('role="tree"');
    expect(html).toContain('role="treeitem"');
    expect(html).toContain('aria-level="2"');
    expect(html).toContain("Khóa thành phần");
    expect(html).toContain("Ẩn thành phần");
    expect(html).toContain("Đang khóa");
    expect(html).toContain("Tiêu đề");
  });

  it("keeps the first visible layer tabbable when there is no primary selection", () => {
    const html = renderToStaticMarkup(<LayersPanel
      elements={elements}
      selectedIds={[]}
      searchQuery=""
      onSelect={() => undefined}
      onPatch={() => undefined}
    />);

    expect(html).toContain('data-layer-select-id="group"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-keyshortcuts="F2"');
  });

  it("exposes optional drag targets for reorder and reparent integration", () => {
    const html = renderToStaticMarkup(<LayersPanel
      elements={elements}
      selectedIds={[]}
      searchQuery=""
      onSelect={() => undefined}
      onPatch={() => undefined}
      onMove={() => undefined}
    />);

    expect(html).toContain('draggable="true"');
    expect(html).toContain('data-layer-drop-target="group"');
  });

  it("renders a clear empty search state", () => {
    const html = renderToStaticMarkup(<LayersPanel
      elements={elements}
      selectedIds={[]}
      searchQuery="không tồn tại"
      onSelect={() => undefined}
      onPatch={() => undefined}
    />);

    expect(html).toContain("Không tìm thấy layer phù hợp");
    expect(html).toContain("Xóa từ khóa hoặc kiểm tra tên thành phần");
  });
});
