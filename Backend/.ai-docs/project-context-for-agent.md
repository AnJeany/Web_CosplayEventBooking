# Thông Tin Dự Án: Hệ Thống Web Quản Lý Sự Kiện Hỗ Trợ Booking Cosplay (V2)

[cite_start]Dự án là một hệ thống quản lý sự kiện tập trung vào mảng cosplay[cite: 4]. 
[cite_start]Hệ thống cho phép Ban tổ chức (BTC) đăng tải thông tin sự kiện công khai[cite: 4].
[cite_start]Hệ thống hỗ trợ khách tham dự đặt vé[cite: 4].
[cite_start]Hệ thống hỗ trợ đặt lịch (booking) các dịch vụ nhiếp ảnh (PTG) và trang điểm (MUA) bên trong sự kiện[cite: 4].

## 1. Phân Quyền Tài Khoản Cốt Lõi
* [cite_start]**Admin**: Nắm quyền quản trị tổng, thiết kế tách biệt với BTC[cite: 43]. [cite_start]Chịu trách nhiệm phê duyệt tài khoản BTC/Dịch vụ, xem báo cáo doanh thu giả lập và xóa booking vi phạm[cite: 43, 65].
* [cite_start]**Ban Tổ Chức (BTC)**: Tạo trang sự kiện độc lập (thời gian, địa điểm, giá vé)[cite: 8]. [cite_start]Thiết lập mở khu vực booth cho dịch vụ[cite: 8]. [cite_start]Đăng bài tuyển booth và xét duyệt ứng viên[cite: 8].
* [cite_start]**Dịch Vụ (PTG/MUA)**: Nộp form ứng tuyển booth tại sự kiện[cite: 8]. [cite_start]Khi được BTC duyệt, có quyền đăng bài nhận khách booking[cite: 8]. [cite_start]Có trang cá nhân (Portfolio) để đăng ảnh giới hạn 25MB/bài[cite: 8, 34].
* [cite_start]**Người Dùng (Khách)**: Xem thông tin sự kiện, mua vé hoặc đăng ký tham dự[cite: 8]. [cite_start]Tương tác (like/comment) trên dòng thời gian sự kiện[cite: 8]. [cite_start]Điền form đặt lịch, thanh toán giả lập và đánh giá dịch vụ[cite: 8].

## 2. Luồng Nghiệp Vụ Chính
* [cite_start]**Quy tắc Booth & Booking**: PTG/MUA chỉ được nhận booking sau khi booth được duyệt thành công[cite: 62]. [cite_start]Số lượng khách tối đa do dịch vụ tự cấu hình và không được đặt trùng thời gian[cite: 56, 57]. [cite_start]Một khách có thể book nhiều bên[cite: 55]. [cite_start]Trạng thái booking đi qua các bước: PendingPayment, Paid, Accepted, Rejected, Completed, Cancelled[cite: 58].
* [cite_start]**Thanh Toán**: Sử dụng cơ chế mô phỏng thành công qua Pop-up giả lập ngân hàng hoặc ví MoMo[cite: 52]. [cite_start]API sẽ cập nhật trạng thái thành công và sinh mã QR[cite: 53].
* [cite_start]**Mạng Xã Hội Thu Nhỏ (Khám Phá & Sự Kiện)**: Các tài khoản có quyền viết bài (Text/Image) bình đẳng trên trang Khám phá[cite: 28, 29]. [cite_start]Người xem có thể Like, Comment, Report[cite: 30].
* [cite_start]**Trang Cá Nhân Tĩnh**: Không có tính năng kết bạn, theo dõi, hay like/comment trên các bài đăng ở Trang cá nhân[cite: 38, 39]. [cite_start]Nút nhắn tin trực tiếp được tích hợp để kết nối nhanh[cite: 36].

## 3. Ràng Buộc Kỹ Thuật (Constraints)
* [cite_start]Sử dụng kiến trúc Monolithic nguyên khối[cite: 50].
* [cite_start]Không triển khai Microservices, hệ thống phân tán, hoặc AI recommendation[cite: 76, 77].
* [cite_start]Hệ thống nhắn tin hoạt động theo cơ chế polling/refresh, không sử dụng WebSocket hay Realtime Server[cite: 45, 75].
* [cite_start]Không tích hợp cổng thanh toán thật[cite: 71].