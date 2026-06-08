using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using CosplayEventBooking.DTOs;

namespace CosplayEventBooking.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper to get Current Admin ID
        private Guid GetCurrentAdminId()
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !Guid.TryParse(adminIdClaim, out var adminId))
            {
                throw new UnauthorizedAccessException("Không xác định được danh tính Admin.");
            }
            return adminId;
        }

        // Helper to log Admin Actions
        private async Task LogActionAsync(string action, string target, string details)
        {
            var adminId = GetCurrentAdminId();
            var log = new AdminLog
            {
                AdminId = adminId,
                Action = action,
                Target = target,
                Details = details,
                Timestamp = DateTime.UtcNow
            };
            _context.AdminLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var userDtos = users.Select(UserDto.FromEntity).ToList();
            return Ok(userDtos);
        }

        [HttpPost("users/{id}/approve")]
        public async Task<IActionResult> ApproveUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy người dùng." });
            }

            if (user.IsApproved)
            {
                return BadRequest(new { Message = "Tài khoản này đã được phê duyệt từ trước." });
            }

            user.IsApproved = true;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await LogActionAsync("Phê duyệt tài khoản", user.Email, $"Đã phê duyệt tài khoản với vai trò {user.Role}.");

            return Ok(new { Message = "Phê duyệt tài khoản thành công.", User = UserDto.FromEntity(user) });
        }

        [HttpPost("users/{id}/lock")]
        public async Task<IActionResult> LockUser(Guid id, [FromBody] string? reason)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy người dùng." });
            }

            if (user.Role == UserRole.Admin && id == GetCurrentAdminId())
            {
                return BadRequest(new { Message = "Bạn không thể tự khóa tài khoản Admin của chính mình." });
            }

            if (user.IsLocked)
            {
                return BadRequest(new { Message = "Tài khoản này đã bị khóa từ trước." });
            }

            user.IsLocked = true;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var lockReason = reason ?? "Không có lý do cụ thể.";
            await LogActionAsync("Khóa tài khoản", user.Email, $"Lý do khóa: {lockReason}");

            return Ok(new { Message = "Khóa tài khoản thành công.", User = UserDto.FromEntity(user) });
        }

        [HttpPost("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy người dùng." });
            }

            if (!user.IsLocked)
            {
                return BadRequest(new { Message = "Tài khoản này đang không bị khóa." });
            }

            user.IsLocked = false;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await LogActionAsync("Mở khóa tài khoản", user.Email, "Đã mở khóa hoạt động trở lại cho tài khoản.");

            return Ok(new { Message = "Mở khóa tài khoản thành công.", User = UserDto.FromEntity(user) });
        }

        [HttpPost("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Role))
            {
                return BadRequest(new { Message = "Vui lòng cung cấp vai trò mới." });
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy người dùng." });
            }

            if (user.Role == UserRole.Admin && id == GetCurrentAdminId())
            {
                return BadRequest(new { Message = "Bạn không thể tự thay đổi vai trò Admin của chính mình." });
            }

            if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            {
                return BadRequest(new { Message = "Vai trò (Role) không hợp lệ." });
            }

            var oldRole = user.Role;
            user.Role = newRole;

            // Nếu chuyển đổi vai trò, thiết lập lại trạng thái duyệt tương ứng
            if (newRole == UserRole.Customer || newRole == UserRole.Admin)
            {
                user.IsApproved = true;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await LogActionAsync("Thay đổi quyền hạn", user.Email, $"Thay đổi vai trò từ {oldRole} sang {newRole}.");

            return Ok(new { Message = "Cập nhật vai trò thành công.", User = UserDto.FromEntity(user) });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { Message = "Không tìm thấy người dùng." });
            }

            if (user.Role == UserRole.Admin && id == GetCurrentAdminId())
            {
                return BadRequest(new { Message = "Bạn không thể tự xóa tài khoản Admin của chính mình." });
            }

            // Bảo vệ tính toàn vẹn dữ liệu: Kiểm tra các liên kết khóa ngoại trước khi xóa
            var hasRelatedData = await _context.Bookings.AnyAsync(b => b.CustomerId == id) ||
                                 await _context.BoothRegistrations.AnyAsync(br => br.ServiceProviderId == id) ||
                                 await _context.Tickets.AnyAsync(t => t.CustomerId == id) ||
                                 await _context.ProfilePosts.AnyAsync(pp => pp.UserId == id) ||
                                 await _context.Messages.AnyAsync(m => m.SenderId == id || m.ReceiverId == id);

            if (hasRelatedData)
            {
                return BadRequest(new { 
                    Message = "Không thể xóa người dùng này vì họ đã có dữ liệu giao dịch hoặc hoạt động liên quan trong hệ thống. Vui lòng sử dụng tính năng khóa tài khoản thay thế để vô hiệu hóa." 
                });
            }

            var userEmail = user.Email;
            var userRole = user.Role;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            await LogActionAsync("Xóa người dùng", userEmail, $"Đã xóa vĩnh viễn tài khoản có vai trò {userRole}.");

            return Ok(new { Message = "Xóa người dùng thành công." });
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetAdminLogs()
        {
            var logs = await _context.AdminLogs
                .Include(l => l.Admin)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            var logDtos = logs.Select(AdminLogDto.FromEntity).ToList();
            return Ok(logDtos);
        }
    }

    public class UpdateUserRoleRequest
    {
        public string Role { get; set; } = null!;
    }
}
