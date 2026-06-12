using System.ComponentModel.DataAnnotations;

namespace CosplayEventBooking.DTOs.Posts
{
    /// <summary>
    /// Payload để tạo một bài viết mới trên Newsfeed.
    /// POST /api/posts
    /// </summary>
    public class CreatePostDto
    {
        /// <summary>ID của tác giả đăng bài.</summary>
        public Guid AuthorId { get; set; }

        /// <summary>
        /// ID sự kiện liên kết. 
        /// Null = hiển thị trên trang Khám phá.
        /// Có giá trị = hiển thị trên timeline của sự kiện đó.
        /// </summary>
        public Guid? EventId { get; set; }

        /// <summary>Nội dung văn bản của bài viết.</summary>
        [Required]
        [MinLength(1)]
        public string Content { get; set; } = null!;

        /// <summary>URL ảnh đính kèm (nếu có).</summary>
        public string? ImageUrl { get; set; }
    }
}
