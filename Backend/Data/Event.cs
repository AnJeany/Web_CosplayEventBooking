using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public class Event
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid OrganizerId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        public decimal TicketPrice { get; set; }
        public int TotalTickets { get; set; }
        public bool HasBooth { get; set; }
        public string? BannerUrl { get; set; }
        public string? Stages { get; set; }
        public DateTime? TicketSaleStartDate { get; set; }
        public DateTime? TicketSaleEndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User Organizer { get; set; } = null!;
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<BoothRegistration> BoothRegistrations { get; set; } = new List<BoothRegistration>();
        public ICollection<ServicePost> ServicePosts { get; set; } = new List<ServicePost>();
        public ICollection<CommunityPost> EventPosts { get; set; } = new List<CommunityPost>();
        public ICollection<EventTicketType> TicketTypes { get; set; } = new List<EventTicketType>();
    }
}