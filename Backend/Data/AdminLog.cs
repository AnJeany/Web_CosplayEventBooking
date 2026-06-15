using System;

namespace CosplayEventBooking.Entities
{
    public class AdminLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AdminId { get; set; }
        public string Action { get; set; } = null!; // Ví dụ: "Khóa tài khoản", "Phê duyệt BTC"
        public string Target { get; set; } = null!; // Tên hoặc Email của đối tượng bị tác động
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Details { get; set; }
        
        public User Admin { get; set; } = null!;
    }
}