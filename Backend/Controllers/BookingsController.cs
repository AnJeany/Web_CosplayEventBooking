using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Bookings;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public BookingsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/bookings
        // Khách đặt lịch dịch vụ. Validate trùng slot trước khi tạo.
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
        {
            // Lấy ServicePost để biết MaxSlots và các booking hiện có
            var servicePost = await _db.ServicePosts
                .Include(sp => sp.Bookings)
                .FirstOrDefaultAsync(sp => sp.Id == dto.ServicePostId);

            if (servicePost == null)
                return NotFound(new { message = $"Không tìm thấy dịch vụ {dto.ServicePostId}." });

            // Parse TimeSlot: format "startISO/endISO"
            var (newStart, newEnd, parseError) = ParseTimeSlot(dto.TimeSlot);
            if (parseError != null)
                return BadRequest(new { message = parseError });

            // Kiểm tra số slot còn trống
            var activeBookingsCount = servicePost.Bookings
                .Count(b => b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.Rejected);

            if (activeBookingsCount >= servicePost.MaxSlots)
                return Conflict(new { message = "Dịch vụ này đã đầy slot. Vui lòng chọn dịch vụ khác." });

            // === Validate trùng lặp TimeSlot ===
            // Lấy tất cả booking active của ServicePost này để kiểm tra overlap
            var existingBookings = servicePost.Bookings
                .Where(b => b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.Rejected)
                .ToList();

            foreach (var existing in existingBookings)
            {
                var (existStart, existEnd, _) = ParseTimeSlot(existing.TimeSlot);
                if (existStart == null || existEnd == null) continue;

                // Kiểm tra overlap: 2 khoảng thời gian chồng nhau nếu start1 < end2 AND start2 < end1
                bool overlaps = newStart < existEnd && existStart < newEnd;
                if (overlaps)
                {
                    return Conflict(new
                    {
                        message = $"Slot thời gian bị trùng với booking đã tồn tại (slot: {existing.TimeSlot}). Vui lòng chọn thời gian khác."
                    });
                }
            }

            var booking = new Booking
            {
                CustomerId = dto.CustomerId,
                ServicePostId = dto.ServicePostId,
                TimeSlot = dto.TimeSlot,
                Status = BookingStatus.PendingPayment
            };

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(CreateBooking), new { bookingId = booking.Id }, new
            {
                booking.Id,
                booking.CustomerId,
                booking.ServicePostId,
                booking.TimeSlot,
                Status = booking.Status.ToString(),
                booking.CreatedAt,
                message = "Đặt lịch thành công. Vui lòng hoàn thành thanh toán để xác nhận."
            });
        }

        // =====================================================================
        // PUT /api/bookings/{bookingId}/status
        // Cập nhật trạng thái booking với validate state machine transition.
        // =====================================================================
        [HttpPut("{bookingId:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid bookingId, [FromBody] UpdateBookingStatusDto dto)
        {
            var booking = await _db.Bookings.FindAsync(bookingId);

            if (booking == null)
                return NotFound(new { message = $"Không tìm thấy booking {bookingId}." });

            // Validate state machine transitions hợp lệ
            if (!IsValidTransition(booking.Status, dto.NewStatus))
            {
                return BadRequest(new
                {
                    message = $"Không thể chuyển trạng thái từ '{booking.Status}' sang '{dto.NewStatus}'.",
                    currentStatus = booking.Status.ToString(),
                    requestedStatus = dto.NewStatus.ToString(),
                    validTransitions = GetValidTransitions(booking.Status)
                });
            }

            // Trạng thái Paid chỉ được set qua mock payment endpoint, không qua đây
            if (dto.NewStatus == BookingStatus.Paid)
                return BadRequest(new { message = "Trạng thái 'Paid' chỉ được cập nhật thông qua API thanh toán: POST /api/payments/mock/{bookingId}." });

            booking.Status = dto.NewStatus;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                booking.Id,
                PreviousStatus = booking.Status.ToString(),
                NewStatus = dto.NewStatus.ToString(),
                message = "Cập nhật trạng thái thành công."
            });
        }

        // =====================================================================
        // Helper: Parse TimeSlot string "startISO/endISO" thành DateTime tuple
        // =====================================================================
        private static (DateTime? start, DateTime? end, string? error) ParseTimeSlot(string timeSlot)
        {
            if (string.IsNullOrWhiteSpace(timeSlot))
                return (null, null, "TimeSlot không được để trống.");

            var parts = timeSlot.Split('/');
            if (parts.Length != 2)
                return (null, null, "TimeSlot không đúng format. Phải là 'startISO/endISO', ví dụ: '2026-06-01T09:00/2026-06-01T10:00'.");

            if (!DateTime.TryParse(parts[0], out var start) || !DateTime.TryParse(parts[1], out var end))
                return (null, null, "Không thể parse thời gian từ TimeSlot. Kiểm tra lại format ISO 8601.");

            if (start >= end)
                return (null, null, "Thời gian bắt đầu phải trước thời gian kết thúc.");

            return (start, end, null);
        }

        // =====================================================================
        // Helper: Kiểm tra state machine transition hợp lệ
        // Luồng: PendingPayment -> Paid -> Accepted -> Completed
        //        Paid -> Rejected (PTG/MUA từ chối sau khi nhận tiền)
        //        * -> Cancelled (trừ Completed)
        // =====================================================================
        private static bool IsValidTransition(BookingStatus current, BookingStatus next)
        {
            return (current, next) switch
            {
                (BookingStatus.PendingPayment, BookingStatus.Paid) => true,
                (BookingStatus.PendingPayment, BookingStatus.Cancelled) => true,
                (BookingStatus.Paid, BookingStatus.Accepted) => true,
                (BookingStatus.Paid, BookingStatus.Rejected) => true,
                (BookingStatus.Paid, BookingStatus.Cancelled) => true,
                (BookingStatus.Accepted, BookingStatus.Completed) => true,
                (BookingStatus.Accepted, BookingStatus.Cancelled) => true,
                _ => false
            };
        }

        private static string[] GetValidTransitions(BookingStatus current)
        {
            return current switch
            {
                BookingStatus.PendingPayment => new[] { "Paid (via /api/payments/mock)", "Cancelled" },
                BookingStatus.Paid => new[] { "Accepted", "Rejected", "Cancelled" },
                BookingStatus.Accepted => new[] { "Completed", "Cancelled" },
                _ => Array.Empty<string>()
            };
        }
    }
}
