# Triển Khai Thông Báo Thiết Yếu

## Status Update - 2026-07-08

- Implemented safe core pieces:
  - BE notification `dedupeKey` support with unique sparse index.
  - `notifyUser` reuses an existing in-app notification when the same `dedupeKey` is used.
  - BE emits notification socket events to the authenticated user's private socket room.
  - FE listens for `notification_created`, `notification_read`, and `notifications_read_all`.
  - FE topbar unread badge now uses `GET /notifications?status=UNREAD&limit=1` pagination total instead of counting only dropdown items.
  - FE topbar dropdown now shows only the latest 5 notifications.
  - FE notification dropdown polls every 5 minutes while socket is connected, and falls back to 45 seconds when disconnected.
  - FE notification click can navigate by `metadata.targetPath`.
  - Mobile navigation is off-canvas so participant screens keep the full viewport width.
  - Submission `ACCEPTED` / `REJECTED` now creates in-app notification for team leader and members.
  - Result publication now creates in-app notification for ranked team leader and members.
  - Board mentor assignment now creates one in-app notification per newly assigned mentor and one corresponding in-app notification for each joined participant on the board teams.
- Existing team invitation behavior is preserved:
  - Unknown invitees still receive email invitation.
  - Existing users still receive in-app team invitation notification with accept/decline dialog.
  - Accept/decline still calls the existing team invitation APIs and invalidates team/notification queries.
- Intentionally not implemented in this scope:
  - Background reminder processor for event/workshop/round/submission deadlines. Current essential notifications are event-driven to avoid extra polling/load.
- Not implemented yet:
  - Immediate notifications for judge assignment.
  - Dedicated `/notifications` full inbox page.

## Summary
- Dùng module `notifications` hiện có làm inbox chính, không viết lại từ đầu.
- Bổ sung các nghiệp vụ tạo notification còn thiếu: nhắc lịch sắp tới, deadline nộp bài, phân công judge/mentor, publish kết quả.
- FE nâng cấp nút chuông: bỏ badge ảo theo 5 item gần nhất, hiển thị đúng tổng unread, dropdown rõ ràng, click được để đi tới màn liên quan.
- Mặc định dùng polling 30-60 giây, chưa dùng realtime socket để giảm rủi ro.

## Backend Changes
- Thêm `dedupeKey` optional vào `Notification` để chống tạo trùng thông báo định kỳ, ví dụ:
  - `event-start:{eventId}:{window}:{userId}`
  - `round-deadline:{roundId}:{window}:{userId}`
  - `workshop-start:{workshopId}:{window}:{userId}`
  - `result-published:{roundId}:{userId}`
- Mở rộng notification service:
  - `notifyUser` hỗ trợ `dedupeKey`.
  - Thêm helper tạo in-app notification an toàn, bỏ qua nếu đã có `dedupeKey`.
  - Reminder mặc định chỉ dùng `IN_APP`, không gửi email để tránh spam.
- Thêm notification reminder processor chạy trong server:
  - Quét mỗi 5 phút.
  - Nhắc trước 24 giờ và 1 giờ cho event/timeline/workshop/round.
  - Nhắc deadline submission trước 2 giờ.
  - Chỉ tạo notification cho user liên quan: participant đã `JOINED`, mentor được gán team, judge được gán round/board, speaker/presenter của workshop.
- Bổ sung notification tức thời ở các flow quan trọng:
  - Khi mentor được assign vào team/board.
  - Khi judge được assign vào round/board.
  - Khi kết quả được publish trong `RANKING_SERVICE.publishResults`.
  - Khi submission được `ACCEPTED` hoặc `REJECTED`, gửi cho leader/team members.
- Metadata mỗi notification có tối thiểu:
  - `eventId`, `roundId`, `teamId` nếu có.
  - `targetPath` để FE navigate, ví dụ `/participant/submissions`, `/judge/scoring`, `/participant/results`, `/mentor/teams`.

## Frontend Changes
- Tách UI thông báo khỏi `Topbar` thành component riêng để dễ bảo trì.
- Query:
  - `GET /notifications?limit=5` lấy danh sách gần nhất.
  - `GET /notifications?status=UNREAD&limit=1` lấy `pagination.totalItems` làm badge unread chính xác.
  - Refetch mỗi 30-60 giây khi user đang đăng nhập.
- Dropdown:
  - Hiển thị loading, empty, error state.
  - Hiển thị title, message, type badge, thời gian tương đối.
  - Click notification: mark read, invalidate query, navigate theo `metadata.targetPath` nếu có.
  - Có nút `Mark all read`.
- Thêm trang `/notifications` nếu cần xem đầy đủ:
  - Danh sách có phân trang.
  - Filter `All / Unread`.
  - Mark từng item hoặc mark all.

## Test Plan
- BE unit tests:
  - `notifyUser` không tạo trùng khi cùng `dedupeKey`.
  - Reminder processor tạo đúng notification cho participant/judge/mentor/speaker liên quan.
  - Reminder processor không tạo notification cho user không liên quan hoặc item đã cancelled/completed.
  - `publishResults` tạo notification result cho các team trong ranking.
  - Submission accepted/rejected tạo notification cho team.
- FE verification:
  - `npm run build` pass.
  - Badge unread hiển thị đúng từ pagination, không chỉ từ 5 item dropdown.
  - Mark read / mark all read cập nhật badge.
  - Click notification điều hướng đúng màn.

## Assumptions
- Scope hiện tại dùng notification thiết yếu theo sự kiện nghiệp vụ, có socket realtime và polling fallback nhẹ.
- Reminder chỉ in-app, không email, để nút chuông là trung tâm thông báo.
- Chưa thêm push/browser notification; socket realtime hiện dùng cho in-app notification.
