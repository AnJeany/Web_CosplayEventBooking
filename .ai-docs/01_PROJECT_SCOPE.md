# THÔNG TIN DỰ ÁN VÀ PHẠM VI (PROJECT SCOPE)

## MỤC TIÊU DỰ ÁN
Xây dựng hệ thống Web API quản lý sự kiện hỗ trợ booking cosplay (dành cho Ban Tổ Chức, Khách tham dự, và Dịch vụ PTG/MUA).

## MVP PRIORITY (CHỈ LÀM NHỮNG TÍNH NĂNG NÀY)
* Authentication & Authorization (Phân quyền cơ bản 3 role: Admin, BTC, User/Service).
* Event Management (Quản lý thông tin sự kiện).
* Ticket Booking (Đặt vé sự kiện cơ bản).
* Booth Registration (Đăng ký gian hàng).
* Service Booking (Đặt lịch dịch vụ PTG/MUA).
* QR Ticket Demo (Sinh mã QR tĩnh, không mã hóa phức tạp).
* Comment/Like cơ bản (Dành cho bài post sự kiện).

## STRICTLY OUT OF SCOPE (TUYỆT ĐỐI KHÔNG LÀM)
* KHÔNG tích hợp cổng thanh toán thật (VNPAY, MoMo). Chỉ làm Mockup/Demo API đổi trạng thái.
* KHÔNG hỗ trợ Video, Livestream, Voice/Video call. Chỉ upload hình ảnh.
* KHÔNG làm bản đồ 2D/3D tương tác.
* KHÔNG dùng WebSocket hoặc Realtime Server. Chat và Notification dùng cơ chế REST API polling cơ bản.
* KHÔNG áp dụng Microservice Architecture hay Distributed System. Chỉ dùng Monolithic Architecture.