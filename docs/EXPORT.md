# Deckory Export

Deckory có hai đường xuất có chủ đích nhưng cùng dùng canonical deck contract:

- **Static V2 export** tạo HTML hoặc SVG deterministic trực tiếp từ `DeckDocumentV2` và shared renderer contracts.
- **Browser export** dùng production Next.js + Chromium cho PNG, JPG, PDF và image-only PPTX hiện tại.

Không đường xuất nào được phép âm thầm tải remote asset, bỏ qua capability warning hoặc mô tả fallback như native/editable.

## Capability disclosure trước khi xuất

Studio V2 hiển thị report theo từng định dạng:

- `native` — renderer xử lý trực tiếp;
- `native-editable` — artifact giữ khả năng chỉnh sửa đã được trusted registry xác nhận;
- `fallback` — dùng SVG/PNG fallback được khai báo;
- `unsupported` — chưa có đường xuất hợp lệ.

Document-level `exportPolicy` chỉ được **hạn chế** capability hoặc chọn fallback. Nó không thể nâng Web Block, component bị thiếu hoặc element unsupported thành native/editable. Registered component chỉ được ghi `native-editable` khi `editableExportCapabilities` là metadata trusted và là tập con của capability đã khai báo.

## Static V2 HTML

```bash
pnpm export:deck -- --deck=scene-foundation --format=html
pnpm export:deck -- --deck=scene-foundation --format=html --output=output/exports/scene-foundation.html
```

HTML export:

- tạo một file độc lập chứa toàn bộ slide;
- render ở canvas 1280 × 720;
- dùng `mode="export"`, final motion state và không có editor controls;
- nhúng local/data assets thành data URI;
- dùng CSP chặn network, object, frame, form và script execution;
- giữ accessible labels, evidence footer và typed chart/diagram output;
- nhúng machine-readable capability report;
- không chứa `react-moveable`, `react-selecto`, `esbuild-wasm` hoặc Studio code.

Output mặc định:

```text
output/exports/<deck-id>.html
output/exports/<deck-id>-html-export.json
```

## Static V2 SVG

```bash
pnpm export:deck -- --deck=scene-foundation --format=svg
pnpm export:deck -- --deck=scene-foundation --format=svg --output=output/exports
```

Mỗi slide được xuất thành một SVG deterministic:

```text
output/exports/<deck-id>-svg/01-<slide-id>.svg
output/exports/<deck-id>-svg/02-<slide-id>.svg
output/exports/<deck-id>-svg/...
output/exports/<deck-id>-svg-export.json
```

SVG export giữ:

- `viewBox="0 0 1280 720"`;
- stable element IDs và hierarchy order;
- native text, shapes, lines, images, tables, chart và diagram;
- title/description accessibility;
- evidence footer;
- Web Block/component fallback asset khi capability report yêu cầu;
- final motion transform và opacity;
- không có remote `href/src`.

`--output=<file.svg>` chỉ hợp lệ khi deck có đúng một slide. Deck nhiều slide phải dùng thư mục output.

## Browser PNG, JPG, PDF và PPTX

```bash
pnpm export:deck -- --deck=deckory-story --format=pdf
pnpm export:deck -- --deck=template-gallery --format=png
pnpm export:deck -- --deck=visual-lab --format=jpg
pnpm export:deck -- --deck=visual-lab --format=pptx
pnpm export:deck -- --deck=visual-lab --format=all
```

Browser pipeline:

1. tạo Next.js `distDir` riêng cho lần xuất;
2. cấp local port trống;
3. build và chạy production server;
4. mở `/export?deck=<id>` bằng Chromium được pin cùng Playwright;
5. chờ font và export-ready contract;
6. kiểm tra deck ID, HTTP failure, console và page error;
7. ghi artifact cùng manifest JSON;
8. dừng server và xóa build tạm.

Không dùng `.next` chung vì dev server hoặc agent khác có thể ghi đè chunk trong lúc xuất.

### PNG/JPG

```text
<output>/<deck-id>-png/01-<slide-id>.png
<output>/<deck-id>-jpg/01-<slide-id>.jpg
```

PNG được kiểm tra đúng kích thước 1280 × 720 sau khi chụp.

### PDF

```text
<output>/<deck-id>.pdf
```

PDF dùng Chromium print engine với background, tagged PDF và CSS page size 16:9. Fidelity vẫn cần visual comparison khi thay font, chart hoặc print CSS.

### PPTX hiện tại

```text
<output>/<deck-id>.pptx
```

Browser PPTX hiện tại là **image-only deck**. Nó không được mô tả như editable. Native-editable PPTX chỉ được công bố theo adapter capability report sau khi proof exporter tương ứng vượt verification.

## Tham số CLI

| Tham số | Giá trị | Mặc định |
| --- | --- | --- |
| `--deck` | ID deck trong local catalog | `deckory-story` |
| `--format` | `html`, `svg`, `pdf`, `png`, `jpg`, `jpeg`, `pptx`, `all` | `pdf` |
| `--output` | Thư mục hoặc file `.html/.svg/.pdf/.pptx` phù hợp format | `output/exports` |
| `--help` | Hiển thị hướng dẫn | — |

Static HTML/SVG hiện yêu cầu `DeckDocumentV2`. Khi truyền V1 deck, CLI dừng với diagnostic rõ thay vì tự migrate hoặc screenshot âm thầm.

## Asset contract

Standalone HTML/SVG chỉ chấp nhận:

- data URI đã có sẵn;
- path local trong repository;
- public asset path bắt đầu bằng `/` và được resolve dưới `apps/present/public`.

Bị từ chối:

- `http://` hoặc `https://`;
- protocol-relative URL;
- path vượt khỏi repository root;
- fallback asset không tồn tại.

Local asset được đọc rồi nhúng vào artifact. Static export không phụ thuộc server sau khi file được tạo.

## Manifest và capability report

Manifest browser mặc định:

```text
<output>/<deck-id>-export.json
```

Manifest static:

```text
<output>/<deck-id>-html-export.json
<output>/<deck-id>-svg-export.json
```

Manifest static ghi:

- deck ID và document revision;
- format và số slide;
- canvas 1280 × 720;
- artifact paths;
- renderer identity;
- capability report cho HTML, SVG, PNG, PDF và PPTX;
- native/native-editable/fallback/unsupported count;
- per-element reason, responsible component/version, fallback và warning.

## Verification

Renderer export tests:

```bash
pnpm --filter @deckory/renderer test -- src/export
pnpm --filter @deckory/renderer typecheck
```

Artifact smoke test:

```bash
pnpm export:deck -- --deck=scene-foundation --format=html --output=output/exports-v2-static
pnpm export:deck -- --deck=scene-foundation --format=svg --output=output/exports-v2-static
```

Browser export/e2e:

```bash
pnpm test:e2e
```

`output/exports/` và build tạm bị ignore khỏi Git. Không commit generated deck, browser binary hoặc temporary Next distribution vào source control.
