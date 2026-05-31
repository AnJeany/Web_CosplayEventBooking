using System;

namespace CosplayEventBooking.Entities
{
    public enum TicketStatus { Valid, CheckedIn }

    public class Ticket
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CustomerId { get; set; }
        public Guid EventId { get; set; }
        public string QrCode { get; set; } = null!;
        public TicketStatus Status { get; set; } = TicketStatus.Valid;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Customer { get; set; } = null!;
        public Event Event { get; set; } = null!;
    }
}