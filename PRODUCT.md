# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Deckory phục vụ người tạo bài thuyết trình, designer và agent cần biến dữ liệu có cấu trúc thành một deck có thể review, chỉnh sửa và trình chiếu trong trình duyệt. Người dùng chính làm việc trên desktop, thường xuyên chuyển giữa quản lý deck, chỉnh nội dung, kiểm tra visual và trình chiếu.

## Product Purpose

Deckory cung cấp document model V1 và Scene V2 có type cho slide, một visual grammar có thể tái sử dụng và các bề mặt Hub, Studio, Preview, Present, Export cùng đọc một nguồn dữ liệu. Thành công nghĩa là người dùng có thể tạo hoặc điều chỉnh một câu chuyện trực quan, phát hiện lỗi cấu trúc/evidence trước khi trình chiếu và tạo artifact đáng tin cậy mà không phải chỉnh JSX thủ công.

## Positioning

Deckory không phải trình tạo PowerPoint bằng prompt. Điểm khác biệt là một AST slide được validate, có thể được con người, editor và agent cùng thao tác mà không làm mất cấu trúc, khả năng kiểm tra hoặc tính nhất quán của visual.

## Operating Context

Deck được quản lý trong Hub, chỉnh trong Studio, kiểm tra bằng Preview, trình chiếu trong Presenter và xuất qua capability-aware pipeline. Dữ liệu minh hoạ phải được ghi nhãn rõ; speaker notes chỉ xuất hiện ở chế độ người thuyết trình. Canvas giữ tỷ lệ 16:9 và scale theo viewport thay vì reflow phá bố cục. Offline nghĩa là toàn bộ runtime asset và export dependency nằm cục bộ; không đồng nghĩa với cloud/PWA sync.

## Capabilities and Constraints

- Deck là dữ liệu có cấu trúc theo `DeckDocument` hoặc `DeckDocumentV2` và phải đi qua validation tương ứng.
- Scene V2 dùng frame/constraint typed; không đưa executable JSX, remote runtime asset hoặc handler tùy ý vào document.
- Editor hiện lưu draft/checkpoint trong trình duyệt và không tuyên bố collaboration hoặc cloud persistence.
- Presenter V2 hỗ trợ multi-slide keyboard navigation, overview, fullscreen và private notes; audience mode không render notes.
- Native editorial charts nằm trong core renderer; advanced chart dùng ECharts SVG lazy-loaded và final-state export.
- Export phải công bố `native`, `native-editable`, `fallback` hoặc `unsupported` trước khi tạo artifact.
- Native PPTX hiện chỉ cam kết editable cho primitive đã hỗ trợ; chart, diagram và custom content không được mô tả như fully editable.
- `elk-layered` và `elk-force` vẫn yêu cầu worker adapter riêng; deck production không được phụ thuộc vào capability chưa xác nhận.
- Hub, Studio, Preview, Present và Export phải dùng chung renderer/scene semantics.

## Brand Commitments

Tên sản phẩm là Deckory. Ngôn ngữ giao diện chính là tiếng Việt, giọng điệu trực tiếp, chuyên nghiệp và tập trung vào việc kể chuyện bằng dữ liệu. Identity hiện tại dùng nền trung tính, mực đậm và accent cobalt/teal/amber; phần mở rộng phải giữ tính biên tập chính xác, không biến thành dashboard SaaS chung chung.

## Evidence on Hand

- Deck tham chiếu V1/V2: `decks/deckory-story/`, `decks/deckory-story-v2/`, `decks/myinterview-defense-v2/`.
- Schema và validation: `packages/schema/src/index.ts`, `packages/schema/src/v2.ts`.
- Shared renderer và multi-slide surface: `packages/renderer/`, `apps/present/components/scene-deck-surface.tsx`.
- Export/capability contract: `docs/EXPORT.md`, `packages/renderer/src/export-capabilities.ts`.
- Release and performance evidence: `tests/e2e/deckory-v2-release.spec.ts`, `tests/e2e/performance-v2.spec.ts`, `apps/present/lib/performance-budgets.ts`.
- Dữ liệu chất lượng và benchmark trong deck hiện chỉ là fixture minh hoạ, không phải claim sản phẩm thực tế.

## Product Principles

1. Một insight hoặc quyết định chính trên mỗi slide.
2. Visual phải giải thích quan hệ dữ liệu, không chỉ trang trí.
3. Editor, agent và presenter cùng thao tác một document model.
4. Lỗi cấu trúc phải được phát hiện trước khi trình chiếu.
5. Motion hỗ trợ mạch kể nhưng không được là nguồn duy nhất của ý nghĩa.

## Accessibility & Inclusion

Mọi thao tác chính phải dùng được bằng bàn phím, có focus rõ, hỗ trợ reduced motion, text có độ tương phản phù hợp và chart có mô tả accessible tương đương.