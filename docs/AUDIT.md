# Deckory Quality Audit

Deckory audit kiểm tra chất lượng document trước khi Studio hoặc Presenter được xem là nguồn bằng chứng cuối cùng. Audit không thay thế browser review; nó chặn các lỗi có thể phát hiện ổn định từ `DeckDocument`.

## Chạy audit

```bash
pnpm audit:decks
pnpm audit:decks -- --strict
pnpm audit:decks -- --json
```

- Lệnh mặc định trả exit code `1` khi có lỗi schema.
- `--strict` trả exit code `1` khi có bất kỳ warning hoặc error nào.
- `--json` xuất report có cấu trúc cho CI, agent hoặc công cụ phân tích khác.

CLI audit toàn bộ deck đã đăng ký trong `apps/present/lib/deck-catalog.ts`. Mỗi lần chạy dùng trực tiếp source TypeScript hiện tại; không đọc snapshot hoặc report cũ.

## Các rule hiện có

| Rule | Mức độ | Ý nghĩa |
| --- | --- | --- |
| `schema-invalid` | Error | Deck không qua `validateDeck`; diagnostic giữ deck, slide, component và property path khi có. |
| `missing-notes` | Warning | Slide thiếu speaker notes để hỗ trợ chuyển ý, caveat và điểm cần nói. |
| `missing-evidence` | Warning | Slide có chart hoặc table nhưng không có `evidence-footer`. |
| `generic-heading` | Warning | Heading chỉ nêu chủ đề như “Kết quả” hoặc “Tổng quan”, chưa nêu kết luận. |
| `dense-slide` | Warning | Slide có hơn sáu component và có nguy cơ quá tải thị giác. |
| `chart-highlight-overuse` | Warning | Chart nhấn mạnh nhiều hơn một datum, làm phân tán kết luận. |
| `repeated-layout` | Warning | Ba slide liên tiếp dùng cùng layout, tạo nhịp visual phẳng. |

Mỗi issue luôn có remediation. Rule mới phải deterministic, có regression test và không phụ thuộc vào đánh giá thẩm mỹ mơ hồ.

## Public API

```ts
import {
  auditDeck,
  auditDecks,
  formatAuditReport
} from "@deckory/audit";

const report = auditDeck(deck);

if (!report.summary.passed) {
  console.error(formatAuditReport([report]));
}
```

`auditDeck` không throw cho lỗi authoring thông thường. Schema failure được chuyển thành `schema-invalid` issues; caller quyết định có chặn workflow hay chỉ hiển thị diagnostic.

## Quality workflow

1. Tạo hoặc chỉnh deck bằng semantic components.
2. Chạy `pnpm audit:decks -- --strict`.
3. Chạy `pnpm test`, `pnpm typecheck`, `pnpm lint` và `pnpm build`.
4. Chạy `pnpm test:e2e` để kiểm tra production CSS, overflow, focus, audience privacy, reduced motion và mobile/coarse-pointer behavior.
5. Review screenshot mới trong `output/playwright/screenshots/<run-id>/`.

Audit pass không chứng minh slide đẹp. Browser screenshot và slide-director pre-flight vẫn bắt buộc cho thay đổi presentation quan trọng.

## Phạm vi chưa có

- pixel-diff baseline giữa các commit;
- đo contrast trực tiếp từ computed styles;
- font fallback detection theo glyph;
- kiểm tra nguồn bên ngoài hoặc xác minh tính đúng của số liệu;
- export fidelity cho PDF, PNG hoặc PPTX.

Các phần này chỉ nên được thêm khi có input contract, test fixture và bằng chứng browser tương ứng.
