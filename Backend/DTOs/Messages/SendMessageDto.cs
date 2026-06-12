using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Messages
{
    /// <summary>
    /// Payload để gửi tin nhắn trực tiếp giữa 2 người dùng.
    /// POST /api/messages
    /// </summary>
    public class SendMessageDto
    {
        /// <summary>ID người gửi.</summary>
        public Guid SenderId { get; set; }

        /// <summary>ID người nhận.</summary>
        public Guid ReceiverId { get; set; }

        /// <summary>Nội dung tin nhắn.</summary>
        [Required]
        [MinLength(1)]
        public string Content { get; set; } = null!;
    }
}
