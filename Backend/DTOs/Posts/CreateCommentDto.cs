using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Posts
{
    /// <summary>
    /// Payload để đăng bình luận vào một bài viết.
    /// POST /api/posts/{postId}/comments
    /// </summary>
    public class CreateCommentDto
    {
        /// <summary>ID người dùng đang bình luận.</summary>
        public Guid UserId { get; set; }

        /// <summary>Nội dung bình luận.</summary>
        [Required]
        [MinLength(1)]
        public string Content { get; set; } = null!;

        /// <summary>
        /// ID của comment cha nếu đây là reply.
        /// Backend sẽ query DB để xác minh ParentId tồn tại trước khi insert.
        /// Null = đây là comment gốc.
        /// </summary>
        public Guid? ParentId { get; set; }
    }
}
