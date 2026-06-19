using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Services;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CosplayEventBooking.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ServicesController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/services/config
        // PTG/MUA thiết lập giá và số slot phục vụ tối đa cho dịch vụ của mình.
        // Business Rule: Chỉ cho phép nếu booth của user tại sự kiện đó đã Approved.
        // =====================================================================
        [HttpPost("config")]
        public async Task<IActionResult> ConfigService([FromBody] ConfigServiceDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || userId != dto.ServiceProviderId || !User.IsInRole("ServiceProvider"))
            {
                return Forbid();
            }

            // === Business Rule: Kiểm tra booth phải ở trạng thái Approved ===
            var approvedBooth = await _db.BoothRegistrations
                .FirstOrDefaultAsync(br =>
                    br.ServiceProviderId == dto.ServiceProviderId &&
                    br.EventId == dto.EventId &&
                    br.Status == BoothStatus.Approved);

            if (approvedBooth == null)
            {
                return BadRequest(new
                {
                    message = "Không thể cấu hình dịch vụ. Booth của bạn tại sự kiện này chưa được phê duyệt hoặc không tồn tại."
                });
            }

            // Kiểm tra đã tạo ServicePost cho combo (ServiceProvider + Event) này chưa
            var existingConfig = await _db.ServicePosts
                .AnyAsync(sp => sp.ServiceProviderId == dto.ServiceProviderId && sp.EventId == dto.EventId);

            if (existingConfig)
                return Conflict(new { message = "Bạn đã cấu hình dịch vụ cho sự kiện này rồi. Hãy dùng endpoint cập nhật nếu muốn thay đổi." });

            var servicePost = new ServicePost
            {
                ServiceProviderId = dto.ServiceProviderId,
                EventId = dto.EventId,
                Price = dto.Price,
                MaxSlots = dto.MaxSlots,
                Rules = dto.Rules
            };

            _db.ServicePosts.Add(servicePost);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(ConfigService), new { servicePostId = servicePost.Id }, new
            {
                servicePost.Id,
                servicePost.ServiceProviderId,
                servicePost.EventId,
                servicePost.Price,
                servicePost.MaxSlots,
                servicePost.Rules,
                servicePost.CreatedAt
            });
        }

        // =====================================================================
        // GET /api/services
        // Lấy danh sách dịch vụ (ServicePost) tại sự kiện (hỗ trợ query eventId).
        // =====================================================================
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetServices([FromQuery] Guid? eventId)
        {
            var query = _db.ServicePosts
                .Include(sp => sp.ServiceProvider)
                .Include(sp => sp.Event)
                .AsQueryable();

            if (eventId.HasValue)
            {
                query = query.Where(sp => sp.EventId == eventId.Value);
            }

            var servicePosts = await query
                .OrderByDescending(sp => sp.CreatedAt)
                .Select(sp => new
                {
                    sp.Id,
                    sp.ServiceProviderId,
                    sp.EventId,
                    sp.Price,
                    sp.MaxSlots,
                    sp.Rules,
                    sp.CreatedAt,
                    ServiceProvider = new
                    {
                        sp.ServiceProvider.Id,
                        sp.ServiceProvider.FullName,
                        sp.ServiceProvider.Email,
                        sp.ServiceProvider.AvatarUrl,
                        sp.ServiceProvider.Bio,
                        Role = sp.ServiceProvider.Role.ToString()
                    },
                    Event = new
                    {
                        sp.Event.Id,
                        sp.Event.Title,
                        sp.Event.Location
                    }
                })
                .ToListAsync();

            return Ok(servicePosts);
        }
    }
}
