using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Services;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
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
    }
}
