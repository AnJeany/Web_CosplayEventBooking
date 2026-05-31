using System;

namespace CosplayEventBooking.Entities
{
    public class Comment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public CommunityPost Post { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}