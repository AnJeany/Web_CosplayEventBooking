using System;
using System.Collections.Generic;
using System.Linq;
using CosplayEventBooking.Entities;
using CosplayEventBooking.Services;

namespace CosplayEventBooking.Data
{
    public static class DbSeeder
    {
        public static void Seed(ApplicationDbContext db, PasswordHasher passwordHasher)
        {
            db.Database.EnsureCreated();

            // 1. Khởi tạo tài khoản Người dùng mẫu (Upsert để đảm bảo mật khẩu luôn đúng)
            var customerId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var customer = db.Users.FirstOrDefault(u => u.Email == "customer@cosbook.com");
            if (customer == null)
            {
                customer = new User
                {
                    Id = customerId,
                    Email = "customer@cosbook.com",
                    FullName = "Aria Cosplay",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.Customer,
                    IsApproved = true,
                    IsLocked = false,
                    AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                    Bio = "Yêu thích cosplay anime và manga!"
                };
                db.Users.Add(customer);
            }
            else
            {
                customer.PasswordHash = passwordHasher.HashPassword("Password123!");
                customer.IsApproved = true;
                customer.IsLocked = false;
            }

            var providerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var provider = db.Users.FirstOrDefault(u => u.Email == "service@cosbook.com");
            if (provider == null)
            {
                provider = new User
                {
                    Id = providerId,
                    Email = "service@cosbook.com",
                    FullName = "Kaito Photography",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.ServiceProvider,
                    IsApproved = true,
                    IsLocked = false,
                    AvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                    Bio = "Nhiếp ảnh gia chuyên nghiệp tại TP. Hồ Chí Minh"
                };
                db.Users.Add(provider);
            }
            else
            {
                provider.PasswordHash = passwordHasher.HashPassword("Password123!");
                provider.IsApproved = true;
                provider.IsLocked = false;
            }

            var organizerId = Guid.Parse("33333333-3333-3333-3333-333333333333");
            var organizer = db.Users.FirstOrDefault(u => u.Email == "organizer@cosbook.com");
            if (organizer == null)
            {
                organizer = new User
                {
                    Id = organizerId,
                    Email = "organizer@cosbook.com",
                    FullName = "BTC Hội Trưởng",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.EventOrganizer,
                    IsApproved = true,
                    IsLocked = false,
                    AvatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
                    Bio = "Đại diện Ban Tổ Chức CosBook"
                };
                db.Users.Add(organizer);
            }
            else
            {
                organizer.PasswordHash = passwordHasher.HashPassword("Password123!");
                organizer.IsApproved = true;
                organizer.IsLocked = false;
            }

            var adminId = Guid.Parse("44444444-4444-4444-4444-444444444444");
            var admin = db.Users.FirstOrDefault(u => u.Email == "admin@cosbook.com");
            if (admin == null)
            {
                admin = new User
                {
                    Id = adminId,
                    Email = "admin@cosbook.com",
                    FullName = "Admin Tổng",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.Admin,
                    IsApproved = true,
                    IsLocked = false,
                    AvatarUrl = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150",
                    Bio = "Quản trị viên tối cao"
                };
                db.Users.Add(admin);
            }
            else
            {
                admin.PasswordHash = passwordHasher.HashPassword("Password123!");
                admin.IsApproved = true;
                admin.IsLocked = false;
            }

            db.SaveChanges();

            if (db.Events.Any())
            {
                return; // Phần dữ liệu khác đã tồn tại, không seed tiếp
            }


            // 2. Khởi tạo Sự kiện mẫu
            var event1Id = Guid.Parse("e1111111-1111-1111-1111-111111111111");
            var event1 = new Event
            {
                Id = event1Id,
                OrganizerId = organizerId,
                Title = "Cosplay Summer Festa 2026",
                Description = "Sự kiện cosplay quy tụ hàng ngàn cosplayer phía Nam cùng chuỗi gian hàng, cuộc thi runway hoành tráng.",
                Location = "Nhà Thi Đấu Phú Thọ, TP. Hồ Chí Minh",
                StartTime = new DateTime(2026, 7, 23, 8, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 7, 24, 18, 0, 0, DateTimeKind.Utc),
                TicketPrice = 150000,
                TotalTickets = 1000,
                HasBooth = true,
                BannerUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200",
                Stages = "Cosplay Runway, Guest Star Meet, DJ Anime Show"
            };

            var event2Id = Guid.Parse("e2222222-2222-2222-2222-222222222222");
            var event2 = new Event
            {
                Id = event2Id,
                OrganizerId = organizerId,
                Title = "Hanoi Anime & Manga Festival 2026",
                Description = "Lễ hội văn hóa Nhật Bản quy mô lớn tại Hà Nội, hoạt động ngoài trời thoáng đãng, booth chụp ảnh ngoài trời cực chill.",
                Location = "Cung Triển Lãm Quy Hoạch Quốc Gia, Hà Nội",
                StartTime = new DateTime(2026, 8, 15, 9, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 8, 15, 21, 0, 0, DateTimeKind.Utc),
                TicketPrice = 0,
                TotalTickets = 2000,
                HasBooth = true,
                BannerUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200",
                Stages = "Singing Contest, Cosplay Group Performance"
            };

            var event3Id = Guid.Parse("e3333333-3333-3333-3333-333333333333");
            var event3 = new Event
            {
                Id = event3Id,
                OrganizerId = organizerId,
                Title = "Da Nang Cosplay Beach Party",
                Description = "Fes cosplay biển cực sôi động lần đầu tiên xuất hiện tại Đà Nẵng. Free hoàn toàn vé ra vào.",
                Location = "Công viên Biển Đông, Đà Nẵng",
                StartTime = new DateTime(2026, 9, 2, 14, 0, 0, DateTimeKind.Utc),
                EndTime = new DateTime(2026, 9, 2, 22, 0, 0, DateTimeKind.Utc),
                TicketPrice = 0,
                TotalTickets = 500,
                HasBooth = false,
                BannerUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
                Stages = "Beach Cosplay Gala, Fire Dance, Water Splash Event"
            };

            db.Events.AddRange(event1, event2, event3);
            db.SaveChanges();

            // 3. Khởi tạo Đăng ký Booth mẫu
            var booth1 = new BoothRegistration
            {
                Id = Guid.Parse("b1111111-1111-1111-1111-111111111111"),
                EventId = event1Id,
                ServiceProviderId = providerId,
                Name = "Kaito Studio (PTG)",
                Size = "Booth Tiêu Chuẩn 3x3m",
                Contact = "0908888888",
                PortfolioLink = "https://behance.net/kaito_photo",
                Type = "ptg",
                Status = BoothStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };

            db.BoothRegistrations.Add(booth1);
            db.SaveChanges();

            // 4. Khởi tạo cấu hình Dịch vụ (ServicePost) mẫu
            var servicePost1 = new ServicePost
            {
                Id = Guid.Parse("s1111111-1111-1111-1111-111111111111"),
                ServiceProviderId = providerId,
                EventId = event1Id,
                Price = 350000,
                MaxSlots = 5,
                Rules = "Chuyên chụp cosplay đêm, chỉnh màu ảo diệu fantasy. Thiết bị Sony A7R4 kèm lens 85mm GM."
            };

            db.ServicePosts.Add(servicePost1);
            db.SaveChanges();

            // 5. Khởi tạo Bài viết Newsfeed (Timeline của BTC & Khám phá của Cộng đồng)
            var post1 = new CommunityPost
            {
                Id = Guid.Parse("p1111111-1111-1111-1111-111111111111"),
                AuthorId = organizerId,
                EventId = event1Id,
                Content = "🔥 BẬT MÍ KHÁCH MỜI GUEST STAR HẠNG A!\nHân hạnh chào đón cosplayer HIKARI đến từ Nhật Bản sẽ trực tiếp làm ban giám khảo chấm thi Runway năm nay. Link mua vé tham dự có sẵn ở mục Mua Vé!",
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            };

            var post2 = new CommunityPost
            {
                Id = Guid.Parse("p2222222-2222-2222-2222-222222222222"),
                AuthorId = customerId,
                EventId = event1Id,
                Content = "Mọi người ơi, đã ai lên đồ cosplay chuẩn bị cho Festa tháng 7 chưa ạ? Em đang cosplay bé Klee xinh xắn cực kì cần 1 thợ nháy dắt đi chụp đây ạ! 📸✨",
                ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            };

            var post3 = new CommunityPost
            {
                Id = Guid.Parse("p3333333-3333-3333-3333-333333333333"),
                AuthorId = providerId,
                EventId = event1Id,
                Content = "Show nhẹ một vài ảnh chụp đợt Festival năm ngoái ạ. Nhận chụp cosplay solo, couple, nhóm. Thiết bị chuyên nghiệp, có đèn rọi xịn sò. Chỉ nhận 5 slots booking cho sự kiện sắp tới!",
                ImageUrl = "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            };

            db.CommunityPosts.AddRange(post1, post2, post3);
            db.SaveChanges();

            // 6. Khởi tạo Comment và Like mẫu
            var comment1 = new Comment
            {
                Id = Guid.NewGuid(),
                PostId = post1.Id,
                UserId = customerId,
                Content = "Tuyệt quá, phải mua vé ngay thôi!",
                CreatedAt = DateTime.UtcNow.AddHours(-1)
            };
            db.Comments.Add(comment1);

            var like1 = new CommunityLike
            {
                PostId = post1.Id,
                UserId = customerId
            };
            db.CommunityLikes.Add(like1);

            db.SaveChanges();
        }
    }
}
