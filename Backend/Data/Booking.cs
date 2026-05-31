using System;

namespace CosplayEventBooking.Entities
{
    public enum BookingStatus { PendingPayment, Paid, Accepted, Rejected, Completed, Cancelled }

    public class Booking
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CustomerId { get; set; }
        public Guid ServicePostId { get; set; }
        public string TimeSlot { get; set; } = null!;
        public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Customer { get; set; } = null!;
        public ServicePost ServicePost { get; set; } = null!;
    }
}