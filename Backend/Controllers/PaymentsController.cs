using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/payments/demo/booking/{id}
        [HttpPost("demo/booking/{id}")]
        public async Task<IActionResult> DemoPaymentBooking(Guid id, [FromBody] DemoPaymentDto dto)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            if (!Enum.TryParse<BookingStatus>(dto.Status, true, out var newStatus))
            {
                return BadRequest("Invalid status. Valid values include: Paid, Completed, etc.");
            }

            booking.Status = newStatus;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Booking status successfully updated to {newStatus}", bookingId = booking.Id });
        }
    }

    public class DemoPaymentDto
    {
        public string Status { get; set; } = null!;
    }
}
