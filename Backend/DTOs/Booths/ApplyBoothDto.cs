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
        public Guid ServiceProviderId { get; set; }
        public string Name { get; set; } = null!;
        public string Size { get; set; } = null!;
        public string Contact { get; set; } = null!;
        public string? PortfolioLink { get; set; }
        public string Type { get; set; } = null!;
    }
}
