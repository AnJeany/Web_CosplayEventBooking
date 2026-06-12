using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/newsfeed")]
    public class NewsfeedController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public NewsfeedController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // GET /api/newsfeed
        // Lấy danh sách bài viết với phân trang và sắp xếp.
        //
        // Query Params:
        //   page       (int, default 1)      - Số trang
        //   pageSize   (int, default 10)     - Số bài/trang
        //   sortBy     (string, default "latest") - "latest" | "mostLiked"
        //   eventId    (Guid?, optional)     - Lọc theo sự kiện cụ thể
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetNewsfeed(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sortBy = "latest",
            [FromQuery] Guid? eventId = null)
        {
            // Validate pagination params
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 50) pageSize = 10;

            var query = _db.CommunityPosts
                .Include(p => p.Author)
                .Include(p => p.Likes)
                .Include(p => p.Comments.Where(c => c.ParentId == null)) // Chỉ lấy comment gốc (không phải reply)
                .AsQueryable();

            // Lọc theo EventId nếu có, ngược lại lấy toàn bộ (trang Khám phá)
            if (eventId.HasValue)
                query = query.Where(p => p.EventId == eventId.Value);

            // Áp dụng sort
            query = sortBy.ToLower() switch
            {
                "mostliked" => query.OrderByDescending(p => p.Likes.Count).ThenByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt) // "latest" là mặc định
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var posts = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.EventId,
                    Author = new { p.Author.Id, p.Author.FullName },
                    p.Content,
                    p.ImageUrl,
                    LikeCount = p.Likes.Count,
                    CommentCount = p.Comments.Count,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                },
                SortBy = sortBy,
                Data = posts
            });
        }
    }
}
