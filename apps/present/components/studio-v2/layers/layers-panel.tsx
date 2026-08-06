"use client";

import type { MouseEvent } from "react";
import type { SceneElement } from "@deckory/schema/v2";
import { buildLayersTree, filterLayersTree, type LayerNode, type LayerPatch } from "./layers-model";
import styles from "./layers-panel.module.css";

export type LayersPanelProps = {
  elements: readonly SceneElement[];
  selectedIds: readonly string[];
  primaryId?: string;
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onSelect: (elementId: string, additive: boolean) => void;
  onPatch: (elementId: string, patch: Partial<LayerPatch>) => void;
};

function LayerTreeItem({
  node,
  level,
  selectedIds,
  primaryId,
  onSelect,
  onPatch
}: {
  node: LayerNode;
  level: number;
  selectedIds: ReadonlySet<string>;
  primaryId: string | undefined;
  onSelect: LayersPanelProps["onSelect"];
  onPatch: LayersPanelProps["onPatch"];
}) {
  const selected = selectedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const handleSelect = (event: MouseEvent<HTMLButtonElement>) => onSelect(node.id, event.shiftKey || event.metaKey || event.ctrlKey);

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-selected={selected}
      aria-expanded={hasChildren ? true : undefined}
      data-layer-kind={node.element.kind}
      data-primary={primaryId === node.id ? "true" : "false"}
    >
      <div className={styles.row}>
        <button
          type="button"
          className={styles.select}
          tabIndex={primaryId === node.id ? 0 : -1}
          onClick={handleSelect}
          aria-label={`Chọn ${node.element.name}`}
        >
          <span aria-hidden="true" className={styles.kind}>{node.element.kind}</span>
          <span>{node.element.name}</span>
        </button>
        <span className={styles.state} aria-live="polite">
          {node.element.locked ? <span>Đang khóa</span> : null}
          {node.element.hidden ? <span>Đang ẩn</span> : null}
        </span>
        <button
          type="button"
          title="Khóa thành phần"
          aria-label={node.element.locked ? `Mở khóa ${node.element.name}` : `Khóa ${node.element.name}`}
          aria-pressed={Boolean(node.element.locked)}
          onClick={() => onPatch(node.id, { locked: !node.element.locked })}
        >
          {node.element.locked ? "Mở khóa" : "Khóa"}
        </button>
        <button
          type="button"
          title="Ẩn thành phần"
          aria-label={node.element.hidden ? `Hiện ${node.element.name}` : `Ẩn ${node.element.name}`}
          aria-pressed={Boolean(node.element.hidden)}
          onClick={() => onPatch(node.id, { hidden: !node.element.hidden })}
        >
          {node.element.hidden ? "Hiện" : "Ẩn"}
        </button>
      </div>
      {hasChildren ? (
        <ul role="group" className={styles.group}>
          {node.children.map((child) => (
            <LayerTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              primaryId={primaryId}
              onSelect={onSelect}
              onPatch={onPatch}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LayersPanel({
  elements,
  selectedIds,
  primaryId,
  searchQuery,
  onSearchChange,
  onSelect,
  onPatch
}: LayersPanelProps) {
  const tree = filterLayersTree(buildLayersTree(elements), searchQuery);
  const selected = new Set(selectedIds);

  return (
    <section className={styles.root} aria-labelledby="studio-v2-layers-title">
      <header>
        <div>
          <h2 id="studio-v2-layers-title">Layers</h2>
          <p>{elements.length} thành phần · {selectedIds.length} đang chọn</p>
        </div>
        <label>
          <span>Tìm layer</span>
          <input
            type="search"
            value={searchQuery}
            readOnly={onSearchChange === undefined}
            onChange={(event) => onSearchChange?.(event.currentTarget.value)}
            placeholder="Tên, loại hoặc ID"
          />
        </label>
      </header>
      {tree.length > 0 ? (
        <ul role="tree" className={styles.tree} aria-label="Cấu trúc thành phần của slide">
          {tree.map((node) => (
            <LayerTreeItem
              key={node.id}
              node={node}
              level={1}
              selectedIds={selected}
              primaryId={primaryId}
              onSelect={onSelect}
              onPatch={onPatch}
            />
          ))}
        </ul>
      ) : (
        <div className={styles.empty} role="status">
          <strong>Không tìm thấy layer phù hợp</strong>
          <p>Xóa từ khóa hoặc kiểm tra tên thành phần.</p>
        </div>
      )}
    </section>
  );
}
