# Báo cáo Phân công Tính năng & Hướng dẫn Bảo vệ Đồ án (CosBook)

Tài liệu này đối chiếu chi tiết giữa **Bản phân công công việc gốc** ([Phân-công-việc.txt](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/.ai-docs/Ph%C3%A2n-c%C3%B4ng-vi%E1%BB%87c.txt)) với **Mã nguồn thực tế trong Git**. Tài liệu này giúp nhóm (An, Hoàng, Đạt) nắm vững cấu trúc file mình chịu trách nhiệm, các thay đổi sau khi gộp nhánh (merge) và chuẩn bị tốt nhất các câu hỏi phản biện từ Giảng viên.

---

## 📊 1. Kiểm tra tích hợp nhánh & Thay đổi sau khi Merge (Git Audit & Changes)

Nhóm có 3 nhánh phát triển chính được gộp vào nhánh `main`. Qua kiểm tra lịch sử Git và mã nguồn thực tế, toàn bộ code từ các nhánh đã được tích hợp thành công, không bị bỏ sót commit nào. Tuy nhiên, sau khi gộp nhánh, hệ thống đã có một số điều chỉnh kỹ thuật để tối ưu hóa, sửa lỗi ràng buộc và đồng bộ hóa với giao diện Frontend.

### 🔄 Chi tiết lịch sử gộp nhánh (Git Merge Graph)
* **`Dat_Dev`** (kết thúc ở commit `27018f9`): Đã được gộp hoàn toàn vào `main` tại commit `d9d33f6`.
* **`Hoang-Dev`** (kết thúc ở commit `e4dcdf3`): Đã được gộp hoàn toàn vào `main` tại commit `7ab554e`.
* **`An-dev`** (nhánh của An, người commit trước ở commit `183dfe8`): Đã được tích hợp và đồng bộ với giao diện Frontend tại commit cuối cùng `e87b208`.

---

### 🔍 Các thay đổi trong file của từng người sau khi Merge & Cải tiến mới

#### A. Nhóm file của Đạt (Core, Phân Quyền & Admin)
Sau khi gộp nhánh, tệp quản trị và xác thực có một số điều chỉnh để sửa lỗi runtime và tăng tính đồng bộ:
1. **[AuthController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/AuthController.cs)**:
   * **Cải tiến**: Cho phép các tài khoản có vai trò **Dịch Vụ** và **Ban Tổ Chức (BTC)** khi chưa được Admin duyệt (`IsApproved = false`) vẫn có thể đăng nhập bình thường vào hệ thống để trải nghiệm dịch vụ dưới quyền Khách tham dự (`Customer`).
2. **[JwtService.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Services/JwtService.cs)**:
   * **Cải tiến**: Tích hợp logic hạ quyền trong JWT. Khi sinh token cho tài khoản chưa duyệt (`IsApproved == false`), claim Role sẽ được gắn là `"Customer"`, giúp hệ thống tự động khóa các API nhạy cảm của vai trò gốc cho tới khi được duyệt.
3. **[UserDto.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/DTOs/UserDto.cs)**:
   * **Cải tiến**: Thêm trường `RealRole` để lưu vai trò đăng ký gốc của tài khoản. Thuộc tính `Role` sẽ trả về `"Customer"` nếu chưa duyệt. Điều này giúp hệ thống Frontend xử lý đồng bộ giao diện trong khi vẫn cung cấp đủ thông tin cho Admin kiểm duyệt.
4. **[AdminController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/AdminController.cs)**:
   * **Thay đổi**: Đổi cách thức nhận tham số của API khóa người dùng (`LockUser`) sang sử dụng DTO `LockUserRequest` để sửa lỗi binding chuỗi JSON thô.
   * **Tối ưu**: Đổi tên biến phụ thuộc từ `_context` thành `_db` để thống nhất phong cách viết code.
   * **Kiểm soát**: Hàm `DeleteUser` được thêm logic kiểm tra khóa ngoại (Foreign Key) để bảo vệ tính toàn vẹn dữ liệu (không cho xóa User nếu đã có vé, booking, booth...).

#### B. Nhóm file của Hoàng (Sự kiện & Vé)
Sau khi merge nhánh `Hoang-Dev`, các API hỗ trợ đã được bổ sung nhằm hoàn thiện trải nghiệm Frontend:
1. **[PaymentsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/PaymentsController.cs)**:
   * **Thay đổi**: Bổ sung API `POST /api/payments/mock/{bookingId}` giả lập thanh toán ngân hàng/MoMo cho dịch vụ đặt lịch chụp/MUA, chuyển trạng thái Booking sang `Paid` và sinh mã QR xác nhận dịch vụ.
2. **[TicketsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/TicketsController.cs)**:
   * **Thay đổi**: Bổ sung API `GET /api/tickets?customerId=...` dùng để lấy danh sách toàn bộ vé đã mua của một khách hàng cụ thể để hiển thị trên giao diện.

#### C. Nhóm file của An (Dịch vụ, Đặt lịch & Cộng đồng)
An là người viết nghiệp vụ backend trước (`183dfe8`), sau đó phát triển toàn bộ Frontend. Các hàm API và giao diện của An đã được nâng cấp đáng kể để đáp ứng các yêu cầu kiểm thử thực chiến:
1. **[BookingsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/BookingsController.cs)**:
   * **Thay đổi**: Bổ sung API `GET /api/bookings` hỗ trợ tìm kiếm và hiển thị danh sách lịch hẹn đặt chụp/MUA theo `customerId`, `serviceProviderId` hoặc `eventId` kèm theo đầy đủ thông tin liên kết (`Include`).
2. **[BoothsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/BoothsController.cs)**:
   * **Thay đổi**: Bổ sung API `GET /api/booths?eventId=...` để hiển thị danh sách các đơn đăng ký booth tại sự kiện trên giao diện.
3. **[NewsfeedController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/NewsfeedController.cs)**:
   * **Thay đổi**: Bổ sung thêm thuộc tính `Role` và `AvatarUrl` của tác giả trong tin tức nhằm tối ưu hóa giao diện hiển thị thông báo.
4. **[EventsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/EventsController.cs) & [Events UI](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Frontend/js/events.js)**:
   * **Cải tiến**: Bổ sung giao diện và modal **Tạo Sự Kiện Mới** cho vai trò Ban Tổ Chức (BTC) gọi thẳng tới API `POST /api/events` để khởi tạo lễ hội mới trực tiếp từ Frontend.
   * **Cải tiến**: Cột **Portfolio Link** được hiển thị dưới dạng liên kết `🌐 Xem Portfolio` trên bảng xét duyệt booth của BTC, giúp BTC xem hồ sơ năng lực của thợ trước khi duyệt.
5. **[Trình Demo Vai Trò UI](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Frontend/index.html)**:
   * **Cải tiến**: Bảng đổi vai trò nhanh được thiết kế nút mũi tên cho phép thu gọn/mở rộng linh hoạt để tiết kiệm không gian màn hình khi thuyết trình.

---

## 👥 2. Đánh giá độ hoàn thiện vai trò (Completeness Check)

Đối chiếu với file phân công việc gốc [Phân-công-việc.txt](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/.ai-docs/Ph%C3%A2n-c%C3%B4ng-vi%E1%BB%87c.txt), toàn bộ **100% các tính năng** được giao cho cả 3 thành viên đều đã được triển khai hoàn chỉnh cả về API Backend lẫn giao diện Frontend.

Dưới đây là bảng đối chiếu chi tiết:

| Thành viên | Nhiệm vụ phân công | File mã nguồn Backend chịu trách nhiệm | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Đạt** | **1.** Setup JWT Authentication & Mã hóa mật khẩu | [JwtService.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Services/JwtService.cs), [PasswordHasher.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Services/PasswordHasher.cs), [Program.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Program.cs#L24-L61) | **Hoàn thành** |
| | **2.** API User & Profile (Đăng nhập, đăng ký, cập nhật avatar/bio) | [AuthController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/AuthController.cs), [ProfileController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/ProfileController.cs#L42-L96) | **Hoàn thành** |
| | **3.** API Portfolio & Upload ảnh (giới hạn 25MB, lưu bảng `ProfilePosts`) | [ProfileController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/ProfileController.cs#L98-L174) | **Hoàn thành** |
| | **4.** API Admin (Quản lý user, cấp quyền, khóa tài khoản, lưu AdminLogs) | [AdminController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/AdminController.cs), [AdminLog.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Data/AdminLog.cs) | **Hoàn thành** |
| **Hoàng** | **1.** API Event CRUD (Tạo, sửa, xóa, danh sách phân trang & lọc) | [EventsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/EventsController.cs) | **Hoàn thành** |
| | **2.** API Mua Vé & Sinh mã QR (Giới hạn 10 vé/người, sinh QR GUID) | [TicketsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/TicketsController.cs#L20-L73) | **Hoàn thành** |
| | **3.** API Demo Thanh Toán (Nhận request giả lập, cập nhật trạng thái vé) | [PaymentsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/PaymentsController.cs#L64-L86) | **Hoàn thành** |
| | **4.** API Check-in (BTC quét đổi trạng thái vé sang `CheckedIn`) | [TicketsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/TicketsController.cs#L75-L101) | **Hoàn thành** |
| **An** | **1.** API Booth & Service (Nộp đơn, BTC duyệt đơn, Cấu hình giá thợ) | [BoothsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/BoothsController.cs), [ServicesController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/ServicesController.cs) | **Hoàn thành** |
| | **2.** API Booking Workflow (Đặt lịch chụp, check trùng slot, state transitions) | [BookingsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/BookingsController.cs), [Booking.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Data/Booking.cs) | **Hoàn thành** |
| | **3.** API Newsfeed & Explore (Đăng bài lễ hội/cộng đồng, comment phân cấp, like) | [NewsfeedController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/NewsfeedController.cs), [PostsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/PostsController.cs) | **Hoàn thành** |
| | **4.** API Messaging Polling (Gửi tin nhắn chat trực tiếp, poll mỗi 4-5s) | [MessagesController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/MessagesController.cs) | **Hoàn thành** |
| | **5.** Xây dựng và tích hợp giao diện Frontend SPA | Thư mục `Frontend/` (HTML, CSS, JS Modules) | **Hoàn thành** |

---

## 🎯 3. Hướng dẫn Phản biện chi tiết từng thành viên (Defense Q&A)

Giảng viên thường sẽ đi sâu vào mã nguồn để kiểm tra xem sinh viên có tự viết code hay không bằng cách đặt ra các câu hỏi kỹ thuật về giải thuật, bảo mật hoặc thiết kế hệ thống. Dưới đây là các định hướng câu hỏi và câu trả lời chuẩn xác nhất cho từng người:

### 👤 Thành viên 1: ĐẠT (Core, Bảo mật & Quản trị)

*   **Lĩnh vực giảng viên sẽ hỏi nhiều nhất**: Cơ chế bảo mật JWT, bảo vệ API khỏi truy cập trái phép, mã hóa mật khẩu, và quyền lực của Admin.

#### 💡 Q1: Giải thích cơ chế băm mật khẩu trong dự án? Tại sao không lưu mật khẩu trực tiếp?
*   **Cách trả lời**: 
    1. Để đảm bảo an toàn thông tin, tránh việc rò rỉ database làm lộ mật khẩu của khách hàng.
    2. Dự án sử dụng thư viện `BCrypt.Net` trong [PasswordHasher.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Services/PasswordHasher.cs) để băm mật khẩu. BCrypt là thuật toán băm chậm (key-stretching) giúp chống lại các cuộc tấn công brute-force và dò tìm bảng băm sẵn (Rainbow Tables) nhờ tích hợp cơ chế muối ngẫu nhiên (salt) tự động sinh ra trong mỗi chuỗi băm.
    3. Khi đăng ký, ta băm mật khẩu bằng `BCrypt.HashPassword()`. Khi đăng nhập, ta đối chiếu mật khẩu người dùng nhập vào với chuỗi băm trong DB thông qua hàm `BCrypt.Verify()`.

#### 💡 Q2: Làm thế nào tài khoản chưa được phê duyệt hoạt động như Khách bình thường, và được cấp quyền chính xác sau khi duyệt?
*   **Cách trả lời**:
    1. Khi người dùng đăng ký vai trò `ServiceProvider` hoặc `EventOrganizer`, `IsApproved` mặc định là `false` và họ **vẫn được đăng nhập** (không bị chặn ở AuthController).
    2. Tuy nhiên, trong [JwtService.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Services/JwtService.cs), hệ thống kiểm tra nếu `!IsApproved` thì claim **Role sẽ bị hạ về `"Customer"`**. Như vậy khi gọi API, middleware authorization sẽ đối xử với họ hoàn toàn như Khách và không cho truy cập các endpoint của BTC/Dịch vụ.
    3. Khi Admin bấm duyệt, cờ `IsApproved` chuyển thành `true`. Trong lần đăng nhập sau, token sinh ra sẽ chứa đúng vai trò thật của họ (`BTC` hoặc `ServiceProvider`).

#### 💡 Q3: JWT Token được sinh ra thế nào và API xác thực người dùng ra sao?
*   **Cách trả lời**:
    1. Khi đăng nhập thành công qua `AuthController.Register` / `Login`, hệ thống gọi `JwtService.cs` để tạo token. Token gồm 3 phần (Header, Payload, Signature) chứa các thông tin (Claims) như `NameIdentifier` (UserId), `Email`, và `Role`.
    2. Token được ký số bằng thuật toán đối xứng `HMAC-SHA256` với khóa bí mật cấu hình ở `appsettings.json`.
    3. Ở backend, trong [Program.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Program.cs#L24-L44), middleware Authentication và Authorization được cấu hình để giải mã và kiểm tra tính hợp lệ của token gửi kèm ở header `Authorization: Bearer <token>`.

---

### 👤 Thành viên 2: HOÀNG (Sự kiện, Vé & Thanh Toán)

*   **Lĩnh vực giảng viên sẽ hỏi nhiều nhất**: Giải quyết tranh chấp tài nguyên (Concurrency), chống quá bán vé (Overbooking), thuật toán QR code, và cách giả lập webhook thanh toán.

#### 💡 Q1: Nếu có 100 người cùng bấm mua vé vào cùng một mili-giây cuối cùng khi sự kiện chỉ còn 1 vé duy nhất, hệ thống của em xử lý thế nào để tránh quá bán?
*   **Cách trả lời**:
    1. Hệ thống sử dụng một Transaction đồng bộ trong Entity Framework Core tại [TicketsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/TicketsController.cs#L20-L73).
    2. Trước khi thêm bản ghi vé mới, hệ thống thực hiện truy vấn đếm tổng số lượng vé đã bán trong database (`CountAsync` các vé có `EventId` tương ứng). 
    3. Tiếp tục so sánh: `Tổng vé đã bán + Số vé muốn mua > Sức chứa sự kiện (Event.TotalTickets)`. Nếu vượt quá, giao dịch sẽ bị từ chối ngay lập tức (`BadRequest`).

#### 💡 Q2: Logic kiểm soát mỗi khách hàng chỉ được mua tối đa 10 vé cho một sự kiện hoạt động thế nào?
*   **Cách trả lời**:
    *   Trong hàm `PurchaseTickets` ở `TicketsController.cs`, hệ thống đếm số lượng vé mà `CustomerId` hiện tại đã sở hữu cho `EventId` này:
        ```csharp
        var userTicketCount = await _context.Tickets
            .Where(t => t.EventId == dto.EventId && t.CustomerId == dto.CustomerId)
            .CountAsync();
        ```
    *   Nếu `userTicketCount + dto.Quantity > 10`, API lập tức chặn và trả về lỗi BadRequest. Ràng buộc này đảm bảo một tài khoản không thể ôm vé đầu cơ tại lễ hội.

---

### 👤 Thành viên 3: AN (Dịch vụ, Đặt lịch & Cộng đồng)

*   **Lĩnh vực giảng viên sẽ hỏi nhiều nhất**: Thiết kế luồng trạng thái phức tạp (State Machine), kiểm tra trùng lặp thời gian đặt shoot chụp (Overlap Validation), cơ chế polling nhắn tin, cấu trúc Frontend ES Modules.

#### 💡 Q1: Hãy giải thích cách em thiết kế và ràng buộc luồng trạng thái của lịch đặt chụp ảnh/makeup (Booking Status Workflow)?
*   **Cách trả lời**:
    1. Trạng thái của Booking được định nghĩa qua Enum `BookingStatus` gồm: `PendingPayment`, `Paid`, `Accepted`, `Rejected`, `Completed`, `Cancelled`.
    2. Luồng đi được kiểm soát chặt chẽ bằng hàm xác thực trạng thái `IsValidTransition()` ở [BookingsController.cs](file:///d:/project_aspnet_api/Web_CosplayEventBooking/Backend/Controllers/BookingsController.cs#L159-L172). Hệ thống chỉ cho phép các bước chuyển đổi hợp lệ:
       * `PendingPayment` -> `Paid` (thực hiện qua `/api/payments/mock/{bookingId}`).
       * `PendingPayment` -> `Cancelled`.
       * `Paid` -> `Accepted` hoặc `Rejected` (chỉ dành cho Thợ dịch vụ thao tác).
       * `Accepted` -> `Completed` / `Cancelled`.

#### 💡 Q2: Giải thuật kiểm tra trùng lịch đặt chụp (Overlap TimeSlot Validation) hoạt động ra sao?
*   **Cách trả lời**:
    1. Chuỗi `TimeSlot` được lưu dưới dạng chuỗi ghép chuẩn ISO 8601: `StartTime/EndTime`.
    2. Khi người dùng đặt lịch mới, hệ thống phân tách chuỗi này thành hai mốc thời gian dạng `DateTime` (`newStart`, `newEnd`).
    3. Hệ thống kiểm tra xem thợ chụp ảnh này đã có lịch hẹn nào hoạt động chưa (`Status != Cancelled` và `Status != Rejected`).
    4. Giải thuật toán học kiểm tra sự chồng chéo (overlap) giữa hai khoảng thời gian $[A, B]$ và $[C, D]$ là: **$A < D$ và $C < B$**.
    5. Cụ thể trong code `BookingsController.cs`:
       ```csharp
       bool overlaps = newStart < existEnd && existStart < newEnd;
       ```
       Nếu điều kiện này đúng, tức là hai khoảng thời gian bị đè lên nhau, API lập tức báo lỗi trùng lịch và yêu cầu khách chọn giờ khác.
