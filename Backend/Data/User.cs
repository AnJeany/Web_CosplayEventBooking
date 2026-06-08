using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public enum UserRole
    {
        Admin,
        EventOrganizer,
        ServiceProvider,
        Customer
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public UserRole Role { get; set; }

        // --- CÁC TRƯỜNG BỔ SUNG ĐỂ ĐÁP ỨNG ĐẶC TẢ ---
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        
        // Quản lý trạng thái tài khoản theo mục 4.1 & 4.5.1
        public bool IsApproved { get; set; } = false; // Mặc định Khách thì true, BTC/Dịch vụ cần Admin duyệt
        public bool IsLocked { get; set; } = false;   // Trạng thái khóa bởi Admin
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties có sẵn
        public ICollection<Booking> BookingsAsCustomer { get; set; } = new List<Booking>();
        public ICollection<BoothRegistration> BoothRegistrations { get; set; } = new List<BoothRegistration>();
        public ICollection<Ticket> PurchasedTickets { get; set; } = new List<Ticket>();
    }

}