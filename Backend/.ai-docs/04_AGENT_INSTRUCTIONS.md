# CHỈ THỊ HOẠT ĐỘNG DÀNH CHO AI AGENT

## QUY TẮC LÀM VIỆC LẮP RÁP
* Đọc kỹ toàn bộ các file `01_PROJECT_SCOPE.md`, `02_TECH_STACK...`, và `03_BUSINESS_RULES...` trước khi tạo mới bất kỳ file code nào.
* KHI VIẾT CODE: Chỉ cung cấp code giải quyết đúng yêu cầu hiện tại. KHÔNG viết dư thừa, KHÔNG tự ý thêm các tính năng "Nice to have" nếu người dùng không yêu cầu rõ ràng.
* KHI PHÁT HIỆN LỖI THIẾT KẾ: Nếu yêu cầu của người dùng mâu thuẫn với `01_PROJECT_SCOPE.md` (ví dụ yêu cầu tích hợp VNPAY), hãy cảnh báo ngay lập tức và đề xuất cách làm giả lập thay thế.

## TIÊU CHUẨN ĐẦU RA CODE
* Code C# phải tuân thủ naming convention (PascalCase cho Class/Method/Property, camelCase cho biến cục bộ).
* Luôn luôn try-catch ở tầng Controller hoặc sử dụng Global Exception Middleware.
* Viết XML Comments ngắn gọn cho các API Endpoint quan trọng.