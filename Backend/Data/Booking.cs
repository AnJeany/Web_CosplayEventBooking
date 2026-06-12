using System;

namespace CosplayEventBooking.Entities
{
    public enum BookingStatus { PendingPayment, Paid, Accepted, Rejected, Completed, Cancelled }

    public class Booking
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CustomerId { get; set; }
        public Guid ServicePostId { get; set; }
        /// <summary>
        /// Format ISO 8601 interval: "2026-06-01T09:00/2026-06-01T10:00"
        /// Backend sẽ parse string này để validate trùng slot.
        /// </summary>
        public string TimeSlot { get; set; } = null!;
        public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;

        /// <summary>
        /// Mã QR xác nhận, được sinh ngẫu nhiên sau khi thanh toán thành công.
        /// Null nếu chưa thanh toán.
        /// </summary>
        public string? QrCode { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Customer { get; set; } = null!;
        public ServicePost ServicePost { get; set; } = null!;
    }
}