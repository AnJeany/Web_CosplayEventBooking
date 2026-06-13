using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TicketsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/tickets/purchase
        [HttpPost("purchase")]
        public async Task<ActionResult<IEnumerable<Ticket>>> PurchaseTickets(PurchaseTicketDto dto)
        {
            if (dto.Quantity <= 0 || dto.Quantity > 10)
            {
                return BadRequest("Quantity must be between 1 and 10.");
            }

            var @event = await _context.Events.FindAsync(dto.EventId);
            if (@event == null)
            {
                return NotFound("Event not found.");
            }

            // Check how many tickets the customer has already bought for this event
            var userTicketCount = await _context.Tickets
                .Where(t => t.EventId == dto.EventId && t.CustomerId == dto.CustomerId)
                .CountAsync();

            if (userTicketCount + dto.Quantity > 10)
            {
                return BadRequest($"You can only buy up to 10 tickets for an event. You already have {userTicketCount} tickets.");
            }

            // Check if there are enough remaining tickets
            var totalTicketsSold = await _context.Tickets
                .Where(t => t.EventId == dto.EventId)
                .CountAsync();

            if (totalTicketsSold + dto.Quantity > @event.TotalTickets)
            {
                return BadRequest("Not enough tickets left for this event.");
            }

            var newTickets = new List<Ticket>();

            for (int i = 0; i < dto.Quantity; i++)
            {
                var ticket = new Ticket
                {
                    EventId = dto.EventId,
                    CustomerId = dto.CustomerId,
                    QrCode = Guid.NewGuid().ToString(), // Generate a random QR Code string
                    Status = TicketStatus.Valid
                };

                newTickets.Add(ticket);
            }

            _context.Tickets.AddRange(newTickets);
            await _context.SaveChangesAsync();

            return Ok(newTickets);
        }

        // POST: api/tickets/checkin
        [HttpPost("checkin")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            if (string.IsNullOrEmpty(dto.QrCode))
            {
                return BadRequest("QR Code is required.");
            }

            var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.QrCode == dto.QrCode);

            if (ticket == null)
            {
                return NotFound("Invalid QR Code.");
            }

            if (ticket.Status == TicketStatus.CheckedIn)
            {
                return BadRequest("Ticket has already been checked in.");
            }

            ticket.Status = TicketStatus.CheckedIn;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Check-in successful", ticketId = ticket.Id });
        }
    }

    public class PurchaseTicketDto
    {
        public Guid EventId { get; set; }
        public Guid CustomerId { get; set; }
        public int Quantity { get; set; }
    }

    public class CheckInDto
    {
        public string QrCode { get; set; } = null!;
    }
}
