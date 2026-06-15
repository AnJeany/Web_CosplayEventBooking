using System;

namespace CosplayEventBooking.Entities
{
    public enum BoothStatus { Pending, Approved, Rejected }

    public class BoothRegistration
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public Guid ServiceProviderId { get; set; }
        public string? Name { get; set; }
        public string? Size { get; set; }
        public string? Contact { get; set; }
        public string? PortfolioLink { get; set; }
        public string? Type { get; set; }
        public BoothStatus Status { get; set; } = BoothStatus.Pending;
        public string? RejectReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Event Event { get; set; } = null!;
        public User ServiceProvider { get; set; } = null!;
    }
}
