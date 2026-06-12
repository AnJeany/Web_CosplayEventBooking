namespace CosplayEventBooking.DTOs.Booths
{
    /// <summary>
    /// Payload cho PTG/MUA nộp form xin mở booth tại một sự kiện.
    /// POST /api/booths/apply
    /// </summary>
    public class ApplyBoothDto
    {
        /// <summary>ID của sự kiện muốn đăng ký booth.</summary>
        public Guid EventId { get; set; }

        /// <summary>ID của người dùng (PTG/MUA) đang nộp đơn.</summary>
        public Guid ServiceProviderId { get; set; }
    }
}
