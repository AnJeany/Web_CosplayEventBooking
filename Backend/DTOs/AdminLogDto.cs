using System;
using CosplayEventBooking.Entities;

namespace CosplayEventBooking.DTOs
{
    public class AdminLogDto
    {
        public Guid Id { get; set; }
        public Guid AdminId { get; set; }
        public string AdminEmail { get; set; } = null!;
        public string Action { get; set; } = null!;
        public string Target { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string? Details { get; set; }

        public static AdminLogDto FromEntity(AdminLog log)
        {
            return new AdminLogDto
            {
                Id = log.Id,
                AdminId = log.AdminId,
                AdminEmail = log.Admin?.Email ?? "Unknown Admin",
                Action = log.Action,
                Target = log.Target,
                Timestamp = log.Timestamp,
                Details = log.Details
            };
        }
    }
}
