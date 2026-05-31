using System;

namespace CosplayEventBooking.Entities
{
    public class Message
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
    }
}