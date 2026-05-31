using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public class ServicePost
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ServiceProviderId { get; set; }
        public Guid EventId { get; set; }

        public decimal Price { get; set; }
        public int MaxSlots { get; set; }
        public string Rules { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User ServiceProvider { get; set; } = null!;
        public Event Event { get; set; } = null!;
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}