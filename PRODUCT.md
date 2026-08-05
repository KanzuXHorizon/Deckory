# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Deckory phục vụ người tạo bài thuyết trình, designer và agent cần biến dữ liệu có cấu trúc thành một deck có thể review, chỉnh sửa và trình chiếu trong trình duyệt. Người dùng chính làm việc trên desktop, thường xuyên chuyển giữa quản lý deck, chỉnh nội dung, kiểm tra visual và trình chiếu.

## Product Purpose

Deckory cung cấp một document model có type cho slide, một bộ visual grammar có thể tái sử dụng và các bề mặt Hub, Studio, Preview, Present cùng đọc một nguồn dữ liệu. Thành công nghĩa là người dùng có thể tạo hoặc điều chỉnh một câu chuyện trực quan, phát hiện lỗi cấu trúc trước khi trình chiếu và mở bản trình chiếu đáng tin cậy mà không phải chỉnh JSX thủ công.

## Positioning

Deckory không phải trình tạo PowerPoint bằng prompt. Điểm khác biệt là một AST slide được validate, có thể được con người, editor và agent cùng thao tác mà không làm mất cấu trúc, khả năng kiểm tra hoặc tính nhất quán của visual.

## Operating Context

Deck được quản lý trong Hub, chỉnh trong Studio, kiểm tra bằng Preview và trình chiếu trong Presenter. Dữ liệu minh hoạ phải được ghi nhãn rõ; speaker notes chỉ xuất hiện ở chế độ người thuyết trình. Canvas giữ tỷ lệ 16:9 và scale theo viewport thay vì reflow phá bố cục.

## Capabilities and Constraints

- Deck là dữ liệu có cấu trúc theo `DeckDocument` và phải đi qua `validateDeck`.
- Chỉ dùng layout và component semantic đã hỗ trợ; không đưa JSX tùy ý, inline coordinate hoặc remote asset vào deck.
- Editor giai đoạn hiện tại lưu draft trong trình duyệt và không tuyên bố collaboration hoặc cloud persistence.
- Presenter hỗ trợ keyboard, sequence reveal, notes, overview, fullscreen và offline readiness.
- Hub, Studio, Preview và Present phải dùng chung renderer.

## Brand Commitments

Tên sản phẩm là Deckory. Ngôn ngữ giao diện chính là tiếng Việt, giọng điệu trực tiếp, chuyên nghiệp và tập trung vào việc kể chuyện bằng dữ liệu. Identity hiện tại dùng nền trung tính, mực đậm và accent cobalt/teal/amber; phần mở rộng phải giữ tính biên tập chính xác, không biến thành dashboard SaaS chung chung.

## Evidence on Hand

- Deck tham chiếu: `decks/deckory-story/deck.ts`.
- Schema và validation: `packages/schema/src/index.ts`.
- Presenter và renderer: `apps/present/components/presenter.tsx`, `apps/present/components/slide-frame.tsx`.
- Dữ liệu chất lượng và benchmark trong deck hiện chỉ là fixture minh hoạ, không phải claim sản phẩm thực tế.

## Product Principles

1. Một insight hoặc quyết định chính trên mỗi slide.
2. Visual phải giải thích quan hệ dữ liệu, không chỉ trang trí.
3. Editor, agent và presenter cùng thao tác một document model.
4. Lỗi cấu trúc phải được phát hiện trước khi trình chiếu.
5. Motion hỗ trợ mạch kể nhưng không được là nguồn duy nhất của ý nghĩa.

## Accessibility & Inclusion

Mọi thao tác chính phải dùng được bằng bàn phím, có focus rõ, hỗ trợ reduced motion, text có độ tương phản phù hợp và chart có mô tả accessible tương đương.