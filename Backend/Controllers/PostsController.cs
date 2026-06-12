using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Posts;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/posts")]
    public class PostsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PostsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/posts
        // Tạo bài viết mới trên Newsfeed (Khám phá hoặc Timeline sự kiện).
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            // Kiểm tra author tồn tại
            var authorExists = await _db.Users.AnyAsync(u => u.Id == dto.AuthorId);
            if (!authorExists)
                return NotFound(new { message = $"Không tìm thấy người dùng {dto.AuthorId}." });

            // Nếu có EventId, kiểm tra sự kiện tồn tại
            if (dto.EventId.HasValue)
            {
                var eventExists = await _db.Events.AnyAsync(e => e.Id == dto.EventId.Value);
                if (!eventExists)
                    return NotFound(new { message = $"Không tìm thấy sự kiện {dto.EventId}." });
            }

            var post = new CommunityPost
            {
                AuthorId = dto.AuthorId,
                EventId = dto.EventId,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl
            };

            _db.CommunityPosts.Add(post);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(CreatePost), new { postId = post.Id }, new
            {
                post.Id,
                post.AuthorId,
                post.EventId,
                post.Content,
                post.ImageUrl,
                post.CreatedAt,
                FeedType = post.EventId.HasValue ? "EventTimeline" : "Explore"
            });
        }

        // =====================================================================
        // POST /api/posts/{postId}/comments
        // Đăng bình luận vào bài viết. Hỗ trợ nested comment (reply) qua ParentId.
        // Business Rule: Nếu có ParentId, phải verify comment cha tồn tại trong DB.
        // =====================================================================
        [HttpPost("{postId:guid}/comments")]
        public async Task<IActionResult> AddComment(Guid postId, [FromBody] CreateCommentDto dto)
        {
            // Kiểm tra bài viết tồn tại
            var postExists = await _db.CommunityPosts.AnyAsync(p => p.Id == postId);
            if (!postExists)
                return NotFound(new { message = $"Không tìm thấy bài viết {postId}." });

            // Kiểm tra người dùng tồn tại
            var userExists = await _db.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists)
                return NotFound(new { message = $"Không tìm thấy người dùng {dto.UserId}." });

            // === Nested Logic Check: Verify parent comment tồn tại nếu có ParentId ===
            if (dto.ParentId.HasValue)
            {
                var parentComment = await _db.Comments
                    .FirstOrDefaultAsync(c => c.Id == dto.ParentId.Value && c.PostId == postId);

                if (parentComment == null)
                {
                    return NotFound(new
                    {
                        message = $"Comment cha (ParentId: {dto.ParentId}) không tồn tại hoặc không thuộc bài viết này."
                    });
                }
            }

            var comment = new Comment
            {
                PostId = postId,
                UserId = dto.UserId,
                Content = dto.Content,
                ParentId = dto.ParentId
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(AddComment), new { postId, commentId = comment.Id }, new
            {
                comment.Id,
                comment.PostId,
                comment.UserId,
                comment.Content,
                comment.ParentId,
                Type = comment.ParentId.HasValue ? "Reply" : "Comment",
                comment.CreatedAt
            });
        }

        // =====================================================================
        // POST /api/posts/{postId}/like
        // Toggle Like/Unlike trên bài viết. Nếu đã like thì Unlike, chưa like thì Like.
        // =====================================================================
        [HttpPost("{postId:guid}/like")]
        public async Task<IActionResult> ToggleLike(Guid postId, [FromQuery] Guid userId)
        {
            // Kiểm tra bài viết tồn tại
            var postExists = await _db.CommunityPosts.AnyAsync(p => p.Id == postId);
            if (!postExists)
                return NotFound(new { message = $"Không tìm thấy bài viết {postId}." });

            // Query tìm like hiện có
            var existingLike = await _db.CommunityLikes
                .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

            bool isNowLiked;

            if (existingLike != null)
            {
                // Đã like → Unlike: Xóa record
                _db.CommunityLikes.Remove(existingLike);
                isNowLiked = false;
            }
            else
            {
                // Chưa like → Like: Thêm record mới
                _db.CommunityLikes.Add(new CommunityLike
                {
                    PostId = postId,
                    UserId = userId
                });
                isNowLiked = true;
            }

            await _db.SaveChangesAsync();

            // Đếm lại tổng số like sau thao tác
            var totalLikes = await _db.CommunityLikes.CountAsync(l => l.PostId == postId);

            return Ok(new
            {
                PostId = postId,
                UserId = userId,
                Action = isNowLiked ? "Liked" : "Unliked",
                TotalLikes = totalLikes
            });
        }
    }
}
