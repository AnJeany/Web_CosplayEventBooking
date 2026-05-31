using System;

namespace CosplayEventBooking.Entities
{
    public class CommunityLike
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }

        public CommunityPost Post { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}