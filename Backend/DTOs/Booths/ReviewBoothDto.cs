using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Booths
{
    /// <summary>
    /// Payload cho BTC xét duyệt yêu cầu mở booth.
    /// PUT /api/booths/{boothId}/review
    /// </summary>
    public class ReviewBoothDto
    {
        /// <summary>ID của BTC đang thực hiện duyệt (thay thế cho Auth claim).</summary>
        public Guid ReviewerId { get; set; }

        /// <summary>Quyết định: "Approve" hoặc "Reject".</summary>
        [Required]
        [RegularExpression("^(Approve|Reject)$", ErrorMessage = "Decision phải là 'Approve' hoặc 'Reject'.")]
        public string Decision { get; set; } = null!;

        /// <summary>Lý do từ chối. Bắt buộc nếu Decision = "Reject".</summary>
        public string? RejectReason { get; set; }
    }
}
