# Deckory Browser Export

Deckory export dùng cùng `SlideFrame` và visual system với Preview/Presenter. Export không dựng lại slide bằng một renderer riêng, vì vậy typography, chart, semantic component và theme giữ cùng một nguồn sự thật.

## Export trong trình duyệt

Mở:

```text
/export?deck=<deck-id>
```

Hoặc chọn **Xuất** trong Studio. Surface export:

- render toàn bộ slide ở 1280 × 720;
- hoàn tất toàn bộ sequence reveal;
- vô hiệu hóa motion;
- không render speaker notes hay Presenter controls;
- dùng một slide trên mỗi trang khi in;
- trả 404 khi deck ID không tồn tại, không âm thầm xuất deck mặc định.

Chọn **In / Lưu PDF** để mở print dialog của trình duyệt. Bật background graphics khi trình duyệt yêu cầu để giữ đầy đủ màu và visual.

## Export bằng CLI

```bash
pnpm export:deck -- --deck=deckory-story --format=pdf
pnpm export:deck -- --deck=template-gallery --format=png
pnpm export:deck -- --deck=visual-lab --format=both --output=output/exports/visual-lab
```

### Tham số

| Tham số | Giá trị | Mặc định |
| --- | --- | --- |
| `--deck` | ID deck trong catalog | `deckory-story` |
| `--format` | `pdf`, `png`, `both` | `pdf` |
| `--output` | Thư mục output; có thể là file `.pdf` khi format là `pdf` | `output/exports` |
| `--help` | Hiển thị hướng dẫn | — |

CLI thực hiện một pipeline cô lập:

1. tạo `distDir` Next.js riêng cho lần export;
2. cấp một local port còn trống;
3. build và chạy production server;
4. mở `/export` bằng Chromium được pin cùng Playwright;
5. kiểm tra deck ID, HTTP errors và browser errors;
6. xuất từng PNG hoặc một PDF nhiều trang;
7. ghi manifest JSON;
8. dừng server và xoá build tạm.

Không sử dụng `.next` chung, vì dev server hoặc agent khác có thể ghi đè production chunks trong lúc export.

## Output contract

PNG được đặt trong:

```text
<output>/<deck-id>-png/01-<slide-id>.png
```

PDF mặc định:

```text
<output>/<deck-id>.pdf
```

Manifest:

```text
<output>/<deck-id>-export.json
```

Manifest ghi:

- deck ID;
- format;
- số slide;
- thời điểm tạo;
- renderer;
- canvas 1280 × 720, tỷ lệ 16:9;
- danh sách file đã xuất.

`output/exports/` bị ignore khỏi Git. Không commit deck export, browser binary hoặc build tạm vào source control.

## Quality gate

Export surface được kiểm tra bằng Playwright cho:

- số slide;
- kích thước 1280 × 720;
- component không vượt safe canvas;
- print media 16:9;
- notes privacy;
- unknown deck 404;
- console/page errors và HTTP response từ 400 trở lên.

Chạy:

```bash
pnpm test:e2e
```

## Giới hạn hiện tại

- PNG/PDF chỉ xuất deck đã đăng ký trong local catalog; browser draft chưa được upload lên server.
- PDF dùng Chromium print engine; fidelity phải được visual-review khi thay font, chart hoặc print CSS.
- PPTX editable chưa được hỗ trợ. Không nên chuyển slide thành PPTX giả bằng ảnh mà không ghi rõ giới hạn chỉnh sửa.
- Remote assets không được tải vào deck export; asset phải local hoặc được schema cho phép.
