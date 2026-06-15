using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using CosplayEventBooking.DTOs;
using CosplayEventBooking.Services;
using Microsoft.AspNetCore.Http;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher _passwordHasher;
        private readonly JwtService _jwtService;

        public AuthController(ApplicationDbContext context, PasswordHasher passwordHasher, JwtService jwtService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kiểm tra email tồn tại
            var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (existingUser)
            {
                return BadRequest(new { Message = "Email đã được sử dụng." });
            }

            // Parse Role từ string sang enum
            if (!Enum.TryParse<UserRole>(request.Role, true, out var roleEnum))
            {
                return BadRequest(new { Message = "Vai trò (Role) không hợp lệ. Chỉ chấp nhận: Customer, ServiceProvider, EventOrganizer, Admin." });
            }

            // Thiết lập IsApproved theo đặc tả: Customer và Admin mặc định true, BTC (EventOrganizer) & Dịch vụ (ServiceProvider) cần phê duyệt (false)
            bool isApproved = (roleEnum == UserRole.Customer || roleEnum == UserRole.Admin);

            var user = new User
            {
                Email = request.Email,
                FullName = request.FullName,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = roleEnum,
                IsApproved = isApproved,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(UserDto.FromEntity(user));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { Message = "Email hoặc mật khẩu không chính xác." });
            }

            // Kiểm tra trạng thái khóa
            if (user.IsLocked)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = "Tài khoản của bạn đã bị khóa bởi quản trị viên." });
            }

            // Kiểm tra trạng thái phê duyệt tài khoản
            if (!user.IsApproved)
            {
                return BadRequest(new { Message = "Tài khoản đang chờ duyệt từ quản trị viên." });
            }

            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                User = UserDto.FromEntity(user)
            });
        }
    }
}
