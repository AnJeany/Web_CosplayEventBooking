using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using CosplayEventBooking.DTOs;

namespace CosplayEventBooking.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProfileController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // Helper to get Current User ID from Claims
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { Message = "Không tìm thấy thông tin tài khoản." });
                }

                return Ok(UserDto.FromEntity(user));
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { Message = "Không tìm thấy thông tin tài khoản." });
                }

                if (request.FullName != null)
                {
                    user.FullName = request.FullName;
                }
                if (request.Bio != null)
                {
                    user.Bio = request.Bio;
                }
                if (request.AvatarUrl != null)
                {
                    user.AvatarUrl = request.AvatarUrl;
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(UserDto.FromEntity(user));
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [HttpPost("portfolio/upload")]
        [RequestSizeLimit(26214400)] // Giới hạn kích thước yêu cầu ở mức 25MB (26,214,400 bytes)
        public async Task<IActionResult> UploadPortfolio(IFormFile file)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Message = "Vui lòng chọn một file ảnh để tải lên." });
                }

                // Kiểm tra kích thước file (<= 25MB)
                const long maxFileSize = 25 * 1024 * 1024; // 25MB
                if (file.Length > maxFileSize)
                {
                    return BadRequest(new { Message = "Kích thước ảnh vượt quá giới hạn cho phép (25MB)." });
                }

                // Kiểm tra định dạng ảnh hợp lệ
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { Message = "Định dạng file không hợp lệ. Chỉ hỗ trợ tải ảnh (.jpg, .jpeg, .png, .gif, .webp)." });
                }

                // Tạo thư mục wwwroot/uploads nếu chưa tồn tại
                var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var uploadsFolder = Path.Combine(webRoot, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Tạo tên file độc nhất để tránh trùng lặp
                var uniqueFileName = Guid.NewGuid().ToString() + extension;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Lưu file vào thư mục local
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Đường dẫn URL tương đối truy cập ảnh tĩnh
                var imageUrl = $"/uploads/{uniqueFileName}";

                // Lưu URL vào bảng ProfilePosts
                var profilePost = new ProfilePost
                {
                    UserId = userId,
                    ImageUrl = imageUrl,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProfilePosts.Add(profilePost);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Tải lên ảnh portfolio thành công.",
                    ProfilePostId = profilePost.Id,
                    ImageUrl = imageUrl,
                    CreatedAt = profilePost.CreatedAt
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Đã xảy ra lỗi hệ thống khi tải ảnh lên.", Details = ex.Message });
            }
        }
    }
}
