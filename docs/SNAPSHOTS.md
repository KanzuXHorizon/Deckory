# Deckory Studio Version Snapshots

Studio snapshots là checkpoint cục bộ để người dùng có thể quay lại một trạng thái document đã kiểm chứng trước khi thực hiện thay đổi lớn. Đây không phải cloud history, realtime collaboration hoặc hệ thống version control thay thế Git.

## Sử dụng

Trong Studio, chọn **Phiên bản**:

1. nhập tên checkpoint, ví dụ `Trước khi chỉnh biểu đồ`;
2. chọn **Tạo checkpoint**;
3. tiếp tục chỉnh sửa deck;
4. mở lại **Phiên bản** và chọn **Khôi phục**;
5. xác nhận thay thế bản nháp hiện tại.

Checkpoint chỉ được tạo khi `validateDeck` pass. Nếu document còn lỗi cấu trúc, Studio giữ input hiện tại nhưng yêu cầu xử lý diagnostics trước.

## Persistence contract

Snapshots được lưu trong `localStorage` theo key:

```text
deckory:snapshots:v1:<deck-id>
```

Mỗi snapshot chứa:

- ID ổn định từ timestamp và suffix tránh va chạm;
- deck ID;
- tên checkpoint;
- thời điểm ISO;
- một clone đầy đủ của `DeckDocument`.

Studio giữ tối đa 20 checkpoint mới nhất cho mỗi deck. Khi đọc storage, parser:

- bỏ dữ liệu không phải array;
- bỏ entry thiếu ID, label hoặc timestamp hợp lệ;
- bỏ snapshot thuộc deck khác;
- validate lại `DeckDocument`;
- loại ID trùng;
- sắp xếp mới nhất trước;
- clone dữ liệu để lịch sử không bị mutate bởi lần restore sau.

## Restore behavior

Restore luôn đi qua confirmation dialog. Khi xác nhận:

- snapshot được clone vào state Studio;
- selection quay về slide tương ứng nếu còn tồn tại, nếu không dùng slide đầu;
- restored document trở thành draft hiện tại;
- snapshot history không bị xoá;
- UI thông báo rõ restored draft đã được lưu hay chỉ còn trong bộ nhớ.

Nếu localStorage bị chặn, restore vẫn hoạt động trong phiên hiện tại và không giả vờ đã persist.

## Accessibility

- Popover dùng `role="dialog"` và trả focus về trigger khi đóng.
- Ô tên checkpoint nhận focus khi mở.
- Restore button có accessible name bao gồm tên snapshot.
- Confirmation dialog focus nút huỷ trước, hỗ trợ Escape và trả focus.
- Mobile/coarse-pointer giữ touch target 44px cho action **Phiên bản**.

## Testing

Pure tests kiểm tra:

- giới hạn 20 snapshot;
- timestamp collision;
- malformed/cross-deck/invalid data;
- sorting;
- detached clone khi restore;
- fallback label.

Production E2E kiểm tra:

- tạo checkpoint có tên;
- edit sau checkpoint và autosave;
- restore qua confirmation;
- draft hiện tại được cập nhật;
- checkpoint tồn tại sau reload;
- malformed history được xoá an toàn;
- focus và mobile reachability.

Chạy:

```bash
pnpm test
pnpm test:e2e
```

## Giới hạn hiện tại

- Snapshots chỉ tồn tại trên trình duyệt/thiết bị hiện tại.
- Không đồng bộ giữa tab, tài khoản hoặc máy khác ngoài cơ chế storage browser.
- Không có diff viewer hoặc merge giữa snapshots.
- Không tự tạo checkpoint cho mỗi autosave để tránh lịch sử nhiễu.
- Không thay thế Git cho source-controlled deck packages.
