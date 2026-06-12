using CosplayEventBooking.Data;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PaymentsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/payments/mock/{bookingId}
        // Giả lập webhook xác nhận thanh toán từ MoMo/Bank.
        // - Chuyển booking sang trạng thái Paid
        // - Sinh mã QR ngẫu nhiên và lưu vào database
        // =====================================================================
        [HttpPost("mock/{bookingId:guid}")]
        public async Task<IActionResult> MockPayment(Guid bookingId)
        {
            var booking = await _db.Bookings
                .Include(b => b.Customer)
                .Include(b => b.ServicePost)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return NotFound(new { message = $"Không tìm thấy booking {bookingId}." });

            // Chỉ được thanh toán nếu đang ở trạng thái PendingPayment
            if (booking.Status != BookingStatus.PendingPayment)
            {
                return BadRequest(new
                {
                    message = $"Booking này không ở trạng thái chờ thanh toán (trạng thái hiện tại: {booking.Status}).",
                    currentStatus = booking.Status.ToString()
                });
            }

            // === Trigger: Cập nhật trạng thái + Sinh mã QR ===
            booking.Status = BookingStatus.Paid;
            booking.QrCode = GenerateQrCode(bookingId);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                booking.Id,
                Status = booking.Status.ToString(),
                booking.QrCode,
                PaymentConfirmedAt = DateTime.UtcNow,
                message = "Thanh toán thành công! Mã QR của bạn đã được tạo.",
                // Thông tin summary
                Summary = new
                {
                    CustomerName = booking.Customer?.FullName,
                    TimeSlot = booking.TimeSlot,
                    Price = booking.ServicePost?.Price
                }
            });
        }

        // =====================================================================
        // Helper: Sinh mã QR ngẫu nhiên dựa trên bookingId + timestamp
        // Format: QR-{BookingId8Chars}-{RandomSuffix8Chars}-{UnixTimestamp}
        // =====================================================================
        private static string GenerateQrCode(Guid bookingId)
        {
            // Lấy 8 ký tự đầu của bookingId (đủ unique kết hợp với timestamp)
            var bookingPart = bookingId.ToString("N").Substring(0, 8).ToUpper();
            // Guid mới để đảm bảo không đoán được
            var randomPart = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            return $"QR-{bookingPart}-{randomPart}-{timestamp}";
        }
    }
}
