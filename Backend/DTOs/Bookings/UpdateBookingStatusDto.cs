using CosplayEventBooking.Entities;

namespace CosplayEventBooking.DTOs.Bookings
{
    /// <summary>
    /// Payload để cập nhật trạng thái của một booking.
    /// PUT /api/bookings/{bookingId}/status
    /// </summary>
    public class UpdateBookingStatusDto
    {
        /// <summary>
        /// Trạng thái mới muốn chuyển sang.
        /// Các luồng hợp lệ:
        /// PendingPayment -> Paid (qua mock payment)
        /// Paid -> Accepted | Rejected (PTG/MUA quyết định)
        /// Accepted -> Completed (sau khi service hoàn tất)
        /// * -> Cancelled (khách hoặc dịch vụ hủy)
        /// </summary>
        public BookingStatus NewStatus { get; set; }
    }
}
