using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CosplayEventBooking.Controllers
{
    [Authorize]
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
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || (userId != dto.CustomerId && !User.IsInRole("Admin")))
            {
                return Forbid();
            }

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

            // Enforce ticket sales date range
            var now = DateTime.UtcNow;
            if (@event.TicketSaleStartDate.HasValue && now < @event.TicketSaleStartDate.Value)
            {
                return BadRequest($"Vé chưa được mở bán. Thời gian mở bán: {@event.TicketSaleStartDate.Value:dd/MM/yyyy HH:mm} (UTC).");
            }
            if (@event.TicketSaleEndDate.HasValue && now > @event.TicketSaleEndDate.Value)
            {
                return BadRequest("Cổng bán vé đã đóng.");
            }

            EventTicketType? ticketType = null;
            var hasTypesConfigured = await _context.EventTicketTypes.AnyAsync(ett => ett.EventId == dto.EventId);

            if (dto.TicketTypeId.HasValue)
            {
                ticketType = await _context.EventTicketTypes.FindAsync(dto.TicketTypeId.Value);
                if (ticketType == null || ticketType.EventId != dto.EventId)
                {
                    return NotFound("Loại vé không tồn tại hoặc không thuộc sự kiện này.");
                }

                if (ticketType.TicketsSold + dto.Quantity > ticketType.TotalTickets)
                {
                    return BadRequest($"Không đủ vé còn lại cho loại {ticketType.Name}. Số vé còn lại: {ticketType.TotalTickets - ticketType.TicketsSold}.");
                }
            }
            else if (hasTypesConfigured)
            {
                return BadRequest("Sự kiện này yêu cầu bạn phải chọn một loại vé cụ thể.");
            }
            else
            {
                // Check standard event-wide remaining tickets (legacy)
                var totalTicketsSold = await _context.Tickets
                    .Where(t => t.EventId == dto.EventId)
                    .CountAsync();

                if (totalTicketsSold + dto.Quantity > @event.TotalTickets)
                {
                    return BadRequest("Không đủ vé còn lại cho sự kiện này.");
                }
            }

            var newTickets = new List<Ticket>();

            for (int i = 0; i < dto.Quantity; i++)
            {
                var ticket = new Ticket
                {
                    EventId = dto.EventId,
                    CustomerId = dto.CustomerId,
                    TicketTypeId = dto.TicketTypeId,
                    QrCode = Guid.NewGuid().ToString(), // Generate a random QR Code string
                    Status = TicketStatus.Valid
                };

                if (ticketType != null)
                {
                    ticketType.TicketsSold += 1;
                }

                newTickets.Add(ticket);
            }

            _context.Tickets.AddRange(newTickets);
            await _context.SaveChangesAsync();

            var response = newTickets.Select(t => new
            {
                t.Id,
                t.CustomerId,
                t.EventId,
                t.QrCode,
                Status = t.Status.ToString(),
                t.CreatedAt
            });

            return Ok(response);
        }

        // POST: api/tickets/checkin
        [HttpPost("checkin")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            if (string.IsNullOrEmpty(dto.QrCode))
            {
                return BadRequest("QR Code is required.");
            }

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var ticket = await _context.Tickets
                .Include(t => t.Event)
                .FirstOrDefaultAsync(t => t.QrCode == dto.QrCode);

            if (ticket == null)
            {
                return NotFound("Invalid QR Code.");
            }

            // Check permission: Only BTC of the event, or Admin can check in
            if (userRole == "BTC")
            {
                if (ticket.Event.OrganizerId != userId)
                {
                    return Forbid();
                }
            }
            else if (userRole != "Admin")
            {
                return Forbid();
            }

            if (ticket.Status == TicketStatus.CheckedIn)
            {
                return BadRequest("Ticket has already been checked in.");
            }

            ticket.Status = TicketStatus.CheckedIn;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Check-in successful", ticketId = ticket.Id });
        }

        // =====================================================================
        // GET /api/tickets
        // Lấy danh sách vé đã mua của khách hàng.
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] Guid? customerId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (userRole == "Customer" || userRole == "ServiceProvider")
            {
                customerId = userId;
            }
            else if (customerId.HasValue && customerId.Value != userId && userRole != "Admin" && userRole != "BTC")
            {
                return Forbid();
            }

            var query = _context.Tickets
                .Include(t => t.Event)
                .Include(t => t.Customer)
                .Include(t => t.TicketType)
                .AsQueryable();

            if (customerId.HasValue)
            {
                query = query.Where(t => t.CustomerId == customerId.Value);
            }

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.CustomerId,
                    t.EventId,
                    t.QrCode,
                    Status = t.Status.ToString(),
                    t.CreatedAt,
                    TicketType = t.TicketType != null ? new
                    {
                        t.TicketType.Id,
                        t.TicketType.Name,
                        t.TicketType.Price
                    } : null,
                    Event = new
                    {
                        t.Event.Id,
                        t.Event.Title,
                        t.Event.Location,
                        t.Event.TicketPrice,
                        t.Event.StartTime,
                        t.Event.EndTime,
                        t.Event.BannerUrl
                    },
                    Customer = new
                    {
                        t.Customer.Id,
                        t.Customer.FullName,
                        t.Customer.Email
                    }
                })
                .ToListAsync();

            return Ok(tickets);
        }
    }

    public class PurchaseTicketDto
    {
        public Guid EventId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid? TicketTypeId { get; set; }
        public int Quantity { get; set; }
    }

    public class CheckInDto
    {
        public string QrCode { get; set; } = null!;
    }
}
