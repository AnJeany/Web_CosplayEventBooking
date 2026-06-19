using System;
using CosplayEventBooking.Entities;

namespace CosplayEventBooking.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string RealRole { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public bool IsApproved { get; set; }
        public bool IsLocked { get; set; }
        public DateTime CreatedAt { get; set; }

        public static UserDto FromEntity(User user)
        {
            var effectiveRole = user.Role;
            if (!user.IsApproved && (user.Role == UserRole.ServiceProvider || user.Role == UserRole.EventOrganizer))
            {
                effectiveRole = UserRole.Customer;
            }

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = effectiveRole.ToString(),
                RealRole = user.Role.ToString(),
                AvatarUrl = user.AvatarUrl,
                Bio = user.Bio,
                IsApproved = user.IsApproved,
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
