using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public class CommunityPost
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid AuthorId { get; set; }
        public Guid? EventId { get; set; } // Null = Trang Khám phá, Có dữ liệu = Timeline sự kiện
        public string Content { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Author { get; set; } = null!;
        public Event? Event { get; set; }
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<CommunityLike> Likes { get; set; } = new List<CommunityLike>();
    }
}