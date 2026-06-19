using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Booths;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CosplayEventBooking.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/booths")]
    public class BoothsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public BoothsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/booths/apply
        // PTG/MUA nộp form xin mở booth tại một sự kiện.
        // =====================================================================
        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] ApplyBoothDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || userId != dto.ServiceProviderId)
            {
                return Forbid();
            }

            // Kiểm tra sự kiện có tồn tại và có hỗ trợ booth không
            var eventExists = await _db.Events
                .AnyAsync(e => e.Id == dto.EventId && e.HasBooth);

            if (!eventExists)
                return NotFound(new { message = $"Sự kiện {dto.EventId} không tồn tại hoặc không mở khu vực booth." });

            // Kiểm tra người dùng có tồn tại không
            var userExists = await _db.Users
                .AnyAsync(u => u.Id == dto.ServiceProviderId && u.Role == UserRole.ServiceProvider);

            if (!userExists)
                return NotFound(new { message = $"ServiceProvider {dto.ServiceProviderId} không tồn tại." });

            // Kiểm tra đã nộp đơn chưa (tránh duplicate)
            var alreadyApplied = await _db.BoothRegistrations
                .AnyAsync(br => br.EventId == dto.EventId && br.ServiceProviderId == dto.ServiceProviderId);

            if (alreadyApplied)
                return Conflict(new { message = "Bạn đã nộp đơn đăng ký booth cho sự kiện này rồi." });

            var booth = new BoothRegistration
            {
                EventId = dto.EventId,
                ServiceProviderId = dto.ServiceProviderId,
                Name = dto.Name,
                Size = dto.Size,
                Contact = dto.Contact,
                PortfolioLink = dto.PortfolioLink,
                Type = dto.Type,
                Status = BoothStatus.Pending
            };

            _db.BoothRegistrations.Add(booth);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Apply), new { boothId = booth.Id }, new
            {
                booth.Id,
                booth.EventId,
                booth.ServiceProviderId,
                Status = booth.Status.ToString(),
                booth.CreatedAt
            });
        }

        // =====================================================================
        // PUT /api/booths/{boothId}/review
        // BTC xét duyệt yêu cầu mở booth: Approve hoặc Reject kèm lý do.
        // =====================================================================
        [HttpPut("{boothId:guid}/review")]
        public async Task<IActionResult> Review(Guid boothId, [FromBody] ReviewBoothDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || (dto.ReviewerId != userId && !User.IsInRole("Admin")))
            {
                return Forbid();
            }

            // Validate: Nếu Reject thì phải có RejectReason
            if (dto.Decision == "Reject" && string.IsNullOrWhiteSpace(dto.RejectReason))
                return BadRequest(new { message = "Phải cung cấp lý do từ chối (RejectReason) khi Decision = 'Reject'." });

            var booth = await _db.BoothRegistrations
                .Include(br => br.Event)
                .FirstOrDefaultAsync(br => br.Id == boothId);

            if (booth == null)
                return NotFound(new { message = $"Không tìm thấy booth registration {boothId}." });

            // Chỉ BTC của đúng sự kiện mới được review
            if (booth.Event.OrganizerId != dto.ReviewerId)
                return Forbid();

            // Chỉ có thể review nếu đang ở trạng thái Pending
            if (booth.Status != BoothStatus.Pending)
                return BadRequest(new { message = $"Booth này đã được xử lý (trạng thái hiện tại: {booth.Status})." });

            booth.Status = dto.Decision == "Approve" ? BoothStatus.Approved : BoothStatus.Rejected;
            booth.RejectReason = dto.Decision == "Reject" ? dto.RejectReason : null;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                booth.Id,
                Status = booth.Status.ToString(),
                booth.RejectReason,
                message = dto.Decision == "Approve"
                    ? "Booth đã được duyệt thành công."
                    : "Booth đã bị từ chối."
            });
        }

        // =====================================================================
        // GET /api/booths
        // Lấy danh sách đăng ký booth của sự kiện.
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetBooths([FromQuery] Guid? eventId)
        {
            var query = _db.BoothRegistrations.AsQueryable();

            if (eventId.HasValue)
            {
                query = query.Where(b => b.EventId == eventId.Value);
            }

            var booths = await query
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.Id,
                    b.EventId,
                    b.ServiceProviderId,
                    b.Name,
                    b.Size,
                    b.Contact,
                    b.PortfolioLink,
                    b.Type,
                    Status = b.Status.ToString(),
                    b.CreatedAt
                })
                .ToListAsync();

            return Ok(booths);
        }
    }
}
