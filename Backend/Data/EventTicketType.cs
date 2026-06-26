using System;

namespace CosplayEventBooking.Entities
{
    public class EventTicketType
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid EventId { get; set; }
        public string Name { get; set; } = null!;
        public decimal Price { get; set; }
        public int TotalTickets { get; set; }
        public int TicketsSold { get; set; } = 0;

        public Event Event { get; set; } = null!;
    }
}
