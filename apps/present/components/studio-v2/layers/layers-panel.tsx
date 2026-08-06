"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import type { SceneElement } from "@deckory/schema/v2";
import {
  buildLayersTree,
  filterLayersTree,
  flattenLayersTree,
  resolveLayerTreeKey,
  type LayerNode,
  type LayerPatch
} from "./layers-model";
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

type LayerTreeItemProps = {
  node: LayerNode;
  level: number;
  tree: readonly LayerNode[];
  selectedIds: ReadonlySet<string>;
  primaryId: string | undefined;
  focusId: string | undefined;
  renamingId: string | undefined;
  renameValue: string;
  onSelect: LayersPanelProps["onSelect"];
  onPatch: LayersPanelProps["onPatch"];
  onFocusRequest: (elementId: string) => void;
  onRenameStart: (node: LayerNode) => void;
  onRenameValueChange: (value: string) => void;
  onRenameCommit: (node: LayerNode) => void;
  onRenameCancel: () => void;
};

function LayerTreeItem({
  node,
  level,
  tree,
  selectedIds,
  primaryId,
  focusId,
  renamingId,
  renameValue,
  onSelect,
  onPatch,
  onFocusRequest,
  onRenameStart,
  onRenameValueChange,
  onRenameCommit,
  onRenameCancel
}: LayerTreeItemProps) {
  const selected = selectedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const handleSelect = (event: MouseEvent<HTMLButtonElement>) => {
    onFocusRequest(node.id);
    onSelect(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
  };
  const handleTreeKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const action = resolveLayerTreeKey(tree, node.id, event);
    if (!action) return;
    event.preventDefault();
    if (action.type === "focus") onFocusRequest(action.elementId);
    if (action.type === "select") {
      onFocusRequest(action.elementId);
      onSelect(action.elementId, action.additive);
    }
    if (action.type === "rename") onRenameStart(node);
  };

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
        {renamingId === node.id ? (
          <input
            className={styles.select}
            value={renameValue}
            autoFocus
            aria-label={`Đổi tên ${node.element.name}`}
            onChange={(event) => onRenameValueChange(event.currentTarget.value)}
            onBlur={() => onRenameCommit(node)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onRenameCancel();
                onFocusRequest(node.id);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.select}
            tabIndex={focusId === node.id ? 0 : -1}
            data-layer-select-id={node.id}
            aria-keyshortcuts="F2"
            onFocus={() => onFocusRequest(node.id)}
            onClick={handleSelect}
            onKeyDown={handleTreeKey}
            aria-label={`Chọn ${node.element.name}`}
          >
            <span aria-hidden="true" className={styles.kind}>{node.element.kind}</span>
            <span>{node.element.name}</span>
          </button>
        )}
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
              tree={tree}
              selectedIds={selectedIds}
              primaryId={primaryId}
              focusId={focusId}
              renamingId={renamingId}
              renameValue={renameValue}
              onSelect={onSelect}
              onPatch={onPatch}
              onFocusRequest={onFocusRequest}
              onRenameStart={onRenameStart}
              onRenameValueChange={onRenameValueChange}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
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
  const visibleIds = flattenLayersTree(tree).map((node) => node.id);
  const [requestedFocusId, setRequestedFocusId] = useState<string | undefined>(primaryId);
  const focusId = requestedFocusId && visibleIds.includes(requestedFocusId)
    ? requestedFocusId
    : primaryId && visibleIds.includes(primaryId)
      ? primaryId
      : visibleIds[0];
  const [renamingId, setRenamingId] = useState<string | undefined>();
  const [renameValue, setRenameValue] = useState("");
  const selected = new Set(selectedIds);

  const focusLayer = (elementId: string) => {
    setRequestedFocusId(elementId);
    if (document.activeElement?.getAttribute("data-layer-select-id") === elementId) return;
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-layer-select-id="${elementId}"]`)?.focus();
    });
  };
  const startRename = (node: LayerNode) => {
    setRequestedFocusId(node.id);
    setRenamingId(node.id);
    setRenameValue(node.element.name);
  };
  const cancelRename = () => {
    setRenamingId(undefined);
    setRenameValue("");
  };
  const commitRename = (node: LayerNode) => {
    const nextName = renameValue.trim();
    if (nextName && nextName !== node.element.name) onPatch(node.id, { name: nextName });
    cancelRename();
    focusLayer(node.id);
  };

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
              tree={tree}
              selectedIds={selected}
              primaryId={primaryId}
              focusId={focusId}
              renamingId={renamingId}
              renameValue={renameValue}
              onSelect={onSelect}
              onPatch={onPatch}
              onFocusRequest={focusLayer}
              onRenameStart={startRename}
              onRenameValueChange={setRenameValue}
              onRenameCommit={commitRename}
              onRenameCancel={cancelRename}
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
