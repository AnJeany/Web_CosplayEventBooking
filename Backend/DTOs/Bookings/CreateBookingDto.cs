using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Bookings
{
    /// <summary>
    /// Payload để khách đặt lịch một dịch vụ.
    /// POST /api/bookings
    /// </summary>
    public class CreateBookingDto
    {
        /// <summary>ID của khách hàng đang đặt lịch.</summary>
        public Guid CustomerId { get; set; }

        /// <summary>ID của ServicePost (dịch vụ) muốn đặt.</summary>
        public Guid ServicePostId { get; set; }

        /// <summary>
        /// Khoảng thời gian đặt lịch theo chuẩn ISO 8601 interval.
        /// Ví dụ: "2026-06-01T09:00/2026-06-01T10:00"
        /// </summary>
        [Required]
        public string TimeSlot { get; set; } = null!;
    }
}
