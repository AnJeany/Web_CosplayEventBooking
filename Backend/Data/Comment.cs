using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public class Comment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Nếu có giá trị => đây là reply của một comment khác (nested comment).
        /// Null => đây là comment gốc trực tiếp vào bài viết.
        /// </summary>
        public Guid? ParentId { get; set; }

        public CommunityPost Post { get; set; } = null!;
        public User User { get; set; } = null!;

        /// <summary>Navigation tới comment cha (nếu là reply).</summary>
        public Comment? Parent { get; set; }

        /// <summary>Danh sách các reply con của comment này.</summary>
        public ICollection<Comment> Replies { get; set; } = new List<Comment>();
    }
}