using System;

namespace CosplayEventBooking.Entities
{
    public class ProfilePost
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string ImageUrl { get; set; } = null!; // Link ảnh Cloudinary/Firebase
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}