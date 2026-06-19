using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CosplayEventBooking.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public EventsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/events
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? startTime = null,
            [FromQuery] DateTime? endTime = null,
            [FromQuery] string? location = null)
        {
            var query = _db.Events.Include(e => e.Organizer).AsQueryable();

            if (startTime.HasValue)
            {
                query = query.Where(e => e.StartTime >= startTime.Value);
            }

            if (endTime.HasValue)
            {
                query = query.Where(e => e.EndTime <= endTime.Value);
            }

            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(e => e.Location.Contains(location));
            }

            var events = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(events);
        }

        // GET: api/events/{id}
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(Guid id)
        {
            var @event = await _db.Events.Include(e => e.Organizer).FirstOrDefaultAsync(e => e.Id == id);

            if (@event == null)
            {
                return NotFound();
            }

            return Ok(@event);
        }

        // POST: api/events
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || (userId != dto.OrganizerId && !User.IsInRole("Admin")) || !User.IsInRole("BTC"))
            {
                return Forbid();
            }

            var organizer = await _db.Users.FindAsync(dto.OrganizerId);
            if (organizer == null || organizer.Role != UserRole.EventOrganizer)
            {
                return BadRequest(new { message = "OrganizerId không tồn tại hoặc người dùng đó không có role EventOrganizer." });
            }

            var newEvent = new Event
            {
                OrganizerId = dto.OrganizerId,
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TicketPrice = dto.TicketPrice,
                TotalTickets = dto.TotalTickets,
                HasBooth = dto.HasBooth,
                BannerUrl = dto.BannerUrl
            };

            _db.Events.Add(newEvent);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEvent), new { id = newEvent.Id }, newEvent);
        }

        // PUT: api/events/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto dto)
        {
            var @event = await _db.Events.FindAsync(id);
            if (@event == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || (@event.OrganizerId != userId && !User.IsInRole("Admin")))
            {
                return Forbid();
            }

            @event.Title = dto.Title;
            @event.Description = dto.Description;
            @event.Location = dto.Location;
            @event.StartTime = dto.StartTime;
            @event.EndTime = dto.EndTime;
            @event.TicketPrice = dto.TicketPrice;
            @event.TotalTickets = dto.TotalTickets;
            @event.HasBooth = dto.HasBooth;
            @event.BannerUrl = dto.BannerUrl;

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EventExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/events/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var @event = await _db.Events.FindAsync(id);
            if (@event == null)
            {
                return NotFound();
            }

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out var userId) || (@event.OrganizerId != userId && !User.IsInRole("Admin")))
            {
                return Forbid();
            }

            _db.Events.Remove(@event);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private bool EventExists(Guid id)
        {
            return _db.Events.Any(e => e.Id == id);
        }
    }

    public class CreateEventDto
    {
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
    }

    public class UpdateEventDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TicketPrice { get; set; }
        public int TotalTickets { get; set; }
        public bool HasBooth { get; set; }
        public string? BannerUrl { get; set; }
    }
}
