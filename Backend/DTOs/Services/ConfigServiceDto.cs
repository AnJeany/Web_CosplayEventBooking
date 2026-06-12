using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Services
{
    /// <summary>
    /// Payload để PTG/MUA cấu hình dịch vụ (giá, max slots) sau khi booth được duyệt.
    /// POST /api/services/config
    /// </summary>
    public class ConfigServiceDto
    {
        /// <summary>ID của PTG/MUA đang cấu hình dịch vụ.</summary>
        public Guid ServiceProviderId { get; set; }

        /// <summary>ID của sự kiện mà booth đã được duyệt.</summary>
        public Guid EventId { get; set; }

        /// <summary>Giá dịch vụ (VNĐ).</summary>
        [Range(0, double.MaxValue, ErrorMessage = "Price phải >= 0.")]
        public decimal Price { get; set; }

        /// <summary>Số lượng slot phục vụ tối đa.</summary>
        [Range(1, int.MaxValue, ErrorMessage = "MaxSlots phải >= 1.")]
        public int MaxSlots { get; set; }

        /// <summary>Nội quy / quy định của dịch vụ.</summary>
        [Required]
        public string Rules { get; set; } = null!;
    }
}
