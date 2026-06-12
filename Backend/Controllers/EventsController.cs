using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public EventsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // POST /api/events
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
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
                HasBooth = dto.HasBooth
            };

            _db.Events.Add(newEvent);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(CreateEvent), new { id = newEvent.Id }, newEvent);
        }

        // GET /api/events
        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            var events = await _db.Events.Include(e => e.Organizer).ToListAsync();
            return Ok(events);
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
    }
}
