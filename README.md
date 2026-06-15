# CosBook - Nền tảng Quản lý Sự kiện & Booking Cosplay

CosBook là một đồ án hệ thống quản lý sự kiện và dịch vụ cosplay tập trung. Ứng dụng hỗ trợ phân quyền người dùng đầy đủ cho 4 nhóm đối tượng: Khách tham dự, Nhiếp ảnh gia/Chuyên viên trang điểm (ServiceProvider), Ban Tổ Chức (EventOrganizer), và Quản trị viên hệ thống (Admin).

Dự án được xây dựng theo kiến trúc nguyên khối (**Monolithic**):
* **Backend**: ASP.NET Core Web API, sử dụng Entity Framework Core kết nối cơ sở dữ liệu SQL Server và xác thực JWT Bearer Token.
* **Frontend**: Thiết kế giao diện tối (Dark Mode) hiện đại bằng HTML5/CSS3 tĩnh, kết hợp Tailwind CSS (CDN) và cấu trúc JavaScript dạng Mô-đun (**ES Modules**).

---

## 📁 Cấu trúc thư mục và vai trò các Tệp tin

Dưới đây là sơ đồ tổ chức mã nguồn của dự án CosBook:

```text
Web_CosplayEventBooking/
│
├── Backend/                            # Mã nguồn ASP.NET Core Web API (Backend)
│   ├── .ai-docs/                       # Tài liệu đặc tả yêu cầu nghiệp vụ gốc
│   ├── Controllers/                    # Các bộ điều hướng API Endpoint (Controllers)
│   │   ├── AdminController.cs          # Quản lý tài khoản (duyệt/khoá) và xem log admin
│   │   ├── AuthController.cs           # Đăng ký, Đăng nhập (tạo JWT) và cấp quyền
│   │   ├── BookingsController.cs       # Đặt lịch dịch vụ PTG/MUA, duyệt lịch nhận khách
│   │   ├── BoothsController.cs         # Nộp form ứng tuyển booth và duyệt/từ chối đơn
│   │   ├── EventsController.cs         # Quản lý thông tin sự kiện (thêm/sửa/xoá/lọc)
│   │   ├── MessagesController.cs       # API chat nhắn tin giữa khách và thợ (Polling)
│   │   ├── NewsfeedController.cs       # API dòng thời gian tin tức sự kiện & khám phá
│   │   ├── PaymentsController.cs       # Giả lập thanh toán MoMo/Ngân hàng qua QR
│   │   ├── PostsController.cs          # Tương tác bài đăng khám phá (đăng/like/comment)
│   │   ├── ProfileController.cs        # Cập nhật thông tin cá nhân & portfolio ảnh mẫu
│   │   └── TicketsController.cs        # Đặt mua và quản lý vé tham dự sự kiện
│   │
│   ├── Data/                           # Quản lý cơ sở dữ liệu (EF Core)
│   │   ├── ApplicationDbContext.cs     # Cấu hình DbContext, liên kết thực thể & khoá ngoại
│   │   └── DbSeeder.cs                 # Tự động chèn tài khoản mặc định và dữ liệu demo
│   │
│   ├── DTOs/                           # Data Transfer Objects (định dạng dữ liệu API)
│   ├── Entities/                       # Lớp thực thể C# (Cơ sở dữ liệu ánh xạ)
│   │   ├── User.cs                     # Thực thể người dùng (FullName, Role, Approved, Locked)
│   │   ├── Event.cs                    # Thực thể sự kiện (BannerUrl, TicketPrice, Stages)
│   │   ├── BoothRegistration.cs        # Thực thể đơn xin thuê gian hàng tại sự kiện
│   │   ├── ServicePost.cs              # Thực thể gói dịch vụ (giá trọn gói, nội quy) của thợ
│   │   ├── Booking.cs                  # Thực thể lịch hẹn (thời gian, trạng thái, QR Code)
│   │   └── Message.cs, Comment.cs...   # Các thực thể phục vụ mạng xã hội & chat
│   │
│   ├── Services/                       # Lớp dịch vụ logic dùng chung
│   │   ├── JwtService.cs               # Tạo mã thông báo JWT bảo mật cho người dùng
│   │   └── PasswordHasher.cs           # Mã hoá và kiểm tra mật khẩu bằng thuật toán BCrypt
│   │
│   ├── wwwroot/                        # Thư mục lưu trữ tài nguyên tĩnh (static files)
│   │   └── uploads/                    # Nơi lưu trữ ảnh Cosplay tải lên từ máy tính
│   │
│   ├── Program.cs                      # Điểm khởi chạy API cấu hình Middleware & DbSeeder
│   └── appsettings.json                # Cấu hình Connection String SQL Server & Jwt Settings
│
├── Frontend/                           # Mã nguồn Giao diện Người dùng (Frontend SPA)
│   ├── index.html                      # Tệp cấu trúc giao diện chính, styled bằng Tailwind CDN
│   └── js/                             # Thư mục chứa các mô-đun JavaScript (ES Modules)
│       ├── app.js                      # Điều phối viên trung tâm: đăng ký hàm lên window & init
│       ├── state.js                    # Lưu trữ trạng thái hoạt động tạm thời & Token của User
│       ├── api.js                      # Client gọi HTTP REST API hỗ trợ đính kèm Authorization JWT
│       ├── toast.js                    # Hiển thị thông báo nhỏ (Toast message) trên UI
│       ├── auth.js                     # Xử lý luồng đăng nhập, đăng ký & đổi vai trò Demo nhanh
│       ├── events.js                   # Xử lý render sự kiện, đăng bài thông báo, like/comment
│       ├── booking.js                  # Quy trình đặt vé, cấu hình đặt lịch dịch vụ & thanh toán QR
│       ├── chat.js                     # Xử lý chat qua Polling tự động gửi/tải tin nhắn sau 4s
│       └── admin.js                    # Xử lý màn hình Admin tổng kiểm duyệt thành viên
│
└── README.md                           # Tệp hướng dẫn này
```

---

## 🛠️ Hướng dẫn cài đặt và Khởi chạy ứng dụng

### 1. Yêu cầu hệ thống (Prerequisites)
* **C# / .NET SDK**: Phiên bản .NET 8.0 trở lên.
* **Database**: Microsoft SQL Server (LocalDB hoặc SQL Server Express).
* **Web Browser**: Trình duyệt hiện đại (Chrome, Edge, Firefox, v.v.).
* **Python**: Cần thiết để khởi chạy máy chủ tệp tĩnh cho Frontend (hoặc sử dụng VS Code Live Server).

### 2. Cấu hình Cơ sở dữ liệu (Database Setup)
1. Mở tệp `Backend/appsettings.json`.
2. Kiểm tra và chỉnh sửa đường dẫn cấu hình kết nối SQL Server tại mục `DefaultConnection` phù hợp với máy của bạn:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=CosplayEventBookingDb;Trusted_Connection=True;MultipleActiveResultSets=true"
   }
   ```
3. Mở Terminal tại thư mục `Backend/` và chạy lệnh sau để áp dụng các Migration vào database:
   ```bash
   dotnet ef database update
   ```
   *(Hệ thống sẽ tự động khởi tạo cơ sở dữ liệu `CosplayEventBookingDb` kèm theo toàn bộ bảng biểu).*

### 3. Khởi động Backend Web API
1. Mở Terminal tại thư mục `Backend/`.
2. Chạy lệnh để build và chạy dự án:
   ```bash
   dotnet run
   ```
3. API sẽ lắng nghe tại địa chỉ mặc định: [http://localhost:5056](http://localhost:5056).
   *(Khi khởi động lần đầu, `DbSeeder` sẽ tự động chèn dữ liệu mẫu bao gồm các tài khoản demo, 3 sự kiện lớn, bài viết newsfeed, đơn đăng ký booth mẫu để bạn trải nghiệm ngay lập tức).*

### 4. Khởi động Frontend
Do giao diện Frontend sử dụng hệ thống **ES Modules** JavaScript nhằm tách biệt tính năng, trình duyệt sẽ chặn các yêu cầu nạp file module nếu mở trực tiếp tệp `index.html` qua giao thức `file://` (lỗi CORS). Bạn **bắt buộc** phải sử dụng một Web Server cục bộ để chạy Frontend.

* **Cách 1: Sử dụng máy chủ HTTP của Python (Đơn giản nhất)**
  1. Mở Terminal mới tại thư mục gốc của dự án.
  2. Khởi chạy máy chủ:
     ```bash
     python -m http.server 8000 --directory Frontend
     ```
  3. Mở trình duyệt và truy cập: [http://localhost:8000/index.html](http://localhost:8000/index.html)

* **Cách 2: Sử dụng Live Server trong VS Code**
  1. Cài đặt tiện ích mở rộng **Live Server** trên VS Code.
  2. Bấm chuột phải vào tệp `Frontend/index.html` và chọn **Open with Live Server**.
  3. Trình duyệt tự động mở ứng dụng trên cổng mặc định (thường là `http://127.0.0.1:5500`).

---

## 🔑 Danh sách tài khoản Demo thử nghiệm nhanh

Tại màn hình đăng nhập hoặc trên bảng điều khiển **"Trình Demo Vai Trò"** (nút nổi góc dưới bên trái), bạn có thể click trực tiếp các vai trò để tự động chuyển tài khoản và trải nghiệm luồng nghiệp vụ tương ứng:

| Vai Trò | Email đăng nhập | Mật khẩu mặc định | Tên Hiển Thị |
| :--- | :--- | :--- | :--- |
| **Khách tham dự (Customer)** | `customer@cosbook.com` | `Password123!` | Aria Cosplay |
| **Dịch vụ PTG / MUA** | `service@cosbook.com` | `Password123!` | Kaito Photography |
| **Ban Tổ Chức (BTC)** | `organizer@cosbook.com` | `Password123!` | BTC Hội Trưởng |
| **Admin Tổng (Admin)** | `admin@cosbook.com` | `Password123!` | Admin Tổng |

---

## 🔄 Quy trình Khảo sát các Luồng Nghiệp vụ chính

Để đánh giá toàn bộ tính năng liên kết giữa Frontend và API thực tế ở Backend, hãy thử nghiệm theo các bước sau:

1. **Mua vé tham dự sự kiện (Customer)**:
   - Đăng nhập tài khoản **Khách tham dự**. Bấm vào xem chi tiết sự kiện "Cosplay Summer Festa 2026".
   - Bấm **Mua Vé Tham Dự**, màn hình hiển thị cổng thanh toán mô phỏng kèm mã QR.
   - Bấm **Xác nhận thanh toán thành công**. 
   - Kiểm tra bằng cách bấm vào icon hình chiếc vé trên thanh Navbar để xem vé đã mua có chứa mã QR Code ngẫu nhiên được cấp từ database.

2. **Ứng tuyển và thiết lập dịch vụ (Service Provider)**:
   - Đổi tài khoản sang **Thợ dịch vụ (ServiceProvider)**.
   - Vào trang sự kiện -> Tab **Đăng Ký Booth**, điền thông tin thương hiệu, số điện thoại, chọn kích thước booth để gửi đơn xin đặt gian hàng dịch vụ lên Ban tổ chức.
   - Đổi tài khoản sang **Ban Tổ Chức (BTC)** -> Vào trang sự kiện -> Tab **Quản Lý Đơn Đăng Ký** -> Bấm **Phê Duyệt** gian hàng vừa ứng tuyển.
   - Quay lại tài khoản **Thợ dịch vụ** -> Tab **Đăng Ký Booth** sẽ chuyển sang trạng thái "ĐÃ DUYỆT".
   - Tại phần **Cấu Hình Dịch Vụ**, điền giá gói chụp (ví dụ: 300.000đ), số slot tối đa và quy quy định chụp ảnh rồi bấm **Kích hoạt**.

3. **Đặt lịch hẹn và Chat trao đổi (Customer - Service)**:
   - Đổi về tài khoản **Khách tham dự** -> Vào trang sự kiện -> Tab **Thuê Thợ Ảnh / Makeup**.
   - Bạn sẽ thấy nhiếp ảnh gia vừa cấu hình xuất hiện trong danh sách.
   - Bấm nút **Chat** để nhắn tin thảo luận ý tưởng (khung chat tự động cập nhật qua polling REST API mỗi 4 giây).
   - Bấm **Đặt Lịch Ngay**, điền ngày giờ, phong cách trang phục cosplay, hoàn tất giao dịch mô phỏng.
   - Trở lại tài khoản **Thợ dịch vụ** -> Bấm icon vé trên Navbar để quản lý lịch hẹn. Thợ có thể bấm **Duyệt Nhận Lịch** hoặc **Từ Chối** khách.

4. **Tương tác Mạng xã hội thu nhỏ (Explore)**:
   - Tại trang chi tiết sự kiện của bất kì tài khoản nào, vào tab **Khám Phá**.
   - Viết bài đăng mới, thử bấm **Đính kèm ảnh** để upload ảnh thật từ máy tính lên backend.
   - Thử nghiệm các nút **Thả tim (Like)**, viết **Bình luận (Comment)** thời gian thực hoặc **Báo cáo vi phạm (Report)**.

5. **Kiểm soát hoạt động của Admin Tổng (Admin)**:
   - Đăng nhập tài khoản **Admin Tổng** hoặc bấm **Trang Admin Tổng** ở góc trình điều khiển Demo.
   - Admin có quyền xem danh sách toàn bộ tài khoản, duyệt nhanh tài khoản thợ chụp mới đăng ký hoặc thực hiện khóa tài khoản vi phạm.
   - Bên phải hiển thị danh sách **Admin Logs** lưu lại chi tiết hành động quản trị hệ thống.
