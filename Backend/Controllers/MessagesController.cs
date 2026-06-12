using CosplayEventBooking.Data;
using CosplayEventBooking.DTOs.Messages;
using CosplayEventBooking.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Controllers
{
    [ApiController]
    [Route("api/messages")]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public MessagesController(ApplicationDbContext db)
        {
            _db = db;
        }

        // =====================================================================
        // POST /api/messages
        // Gửi tin nhắn trực tiếp từ SenderId đến ReceiverId.
        // Ghi nhận Content, SenderId, ReceiverId, Timestamp vào database.
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            // Kiểm tra sender và receiver không phải cùng người
            if (dto.SenderId == dto.ReceiverId)
                return BadRequest(new { message = "Không thể tự gửi tin nhắn cho chính mình." });

            // Kiểm tra cả 2 người dùng tồn tại
            var senderExists = await _db.Users.AnyAsync(u => u.Id == dto.SenderId);
            if (!senderExists)
                return NotFound(new { message = $"Không tìm thấy người gửi {dto.SenderId}." });

            var receiverExists = await _db.Users.AnyAsync(u => u.Id == dto.ReceiverId);
            if (!receiverExists)
                return NotFound(new { message = $"Không tìm thấy người nhận {dto.ReceiverId}." });

            var message = new Message
            {
                SenderId = dto.SenderId,
                ReceiverId = dto.ReceiverId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            // Tính ConversationId để client biết dùng channel nào khi polling
            var conversationId = BuildConversationId(dto.SenderId, dto.ReceiverId);

            return CreatedAtAction(nameof(SendMessage), new { messageId = message.Id }, new
            {
                message.Id,
                message.SenderId,
                message.ReceiverId,
                message.Content,
                message.CreatedAt,
                ConversationId = conversationId
            });
        }

        // =====================================================================
        // GET /api/messages/poll/{conversationId}
        // API polling để client lấy tin nhắn mới trong một cuộc hội thoại.
        // ConversationId = {minUserId}_{maxUserId} (deterministic, không phân biệt ai gửi ai nhận)
        //
        // Query Params (chọn 1 trong 2):
        //   lastMessageId  (Guid?)    - Lấy các tin nhắn có Id xuất hiện sau messageId này
        //   lastTimestamp  (DateTime?) - Lấy các tin nhắn sau thời điểm này (ISO 8601)
        //
        // Client nên gọi mỗi 5 giây và truyền lastMessageId của tin nhắn cuối cùng nhận được.
        // =====================================================================
        [HttpGet("poll/{conversationId}")]
        public async Task<IActionResult> PollMessages(
            string conversationId,
            [FromQuery] Guid? lastMessageId = null,
            [FromQuery] DateTime? lastTimestamp = null)
        {
            // Parse conversationId thành 2 UserId
            var userIds = ParseConversationId(conversationId);
            if (userIds == null)
                return BadRequest(new { message = "ConversationId không hợp lệ. Format phải là '{userId1}_{userId2}'." });

            var (userId1, userId2) = userIds.Value;

            // Base query: tin nhắn giữa 2 người này (cả 2 chiều)
            var query = _db.Messages
                .Where(m =>
                    (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                    (m.SenderId == userId2 && m.ReceiverId == userId1))
                .OrderBy(m => m.CreatedAt)
                .AsQueryable();

            // === Optimization: Chỉ trả về tin nhắn MỚI, không load toàn bộ lịch sử ===
            if (lastMessageId.HasValue)
            {
                // Tìm timestamp của tin nhắn cuối client đã có
                var lastMsg = await _db.Messages.FindAsync(lastMessageId.Value);
                if (lastMsg != null)
                {
                    query = query.Where(m => m.CreatedAt > lastMsg.CreatedAt);
                }
            }
            else if (lastTimestamp.HasValue)
            {
                // Client gửi timestamp (UTC), lấy tin nhắn sau thời điểm đó
                var utcTimestamp = lastTimestamp.Value.Kind == DateTimeKind.Utc
                    ? lastTimestamp.Value
                    : lastTimestamp.Value.ToUniversalTime();

                query = query.Where(m => m.CreatedAt > utcTimestamp);
            }

            var newMessages = await query
                .Select(m => new
                {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Content,
                    m.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                ConversationId = conversationId,
                NewMessageCount = newMessages.Count,
                LastPolledAt = DateTime.UtcNow,
                Messages = newMessages,
                // Hint cho client: dùng Id của tin nhắn cuối cùng làm lastMessageId cho lần poll tiếp theo
                NextPollHint = newMessages.Count > 0
                    ? new { LastMessageId = newMessages.Last().Id }
                    : null
            });
        }

        // =====================================================================
        // Helper: Tạo ConversationId deterministic từ 2 UserId
        // Sort 2 Guid để đảm bảo {A,B} và {B,A} cho cùng 1 ConversationId
        // =====================================================================
        private static string BuildConversationId(Guid userId1, Guid userId2)
        {
            var ids = new[] { userId1.ToString("N"), userId2.ToString("N") };
            Array.Sort(ids, StringComparer.Ordinal);
            return $"{ids[0]}_{ids[1]}";
        }

        private static (Guid, Guid)? ParseConversationId(string conversationId)
        {
            var parts = conversationId.Split('_');
            if (parts.Length != 2) return null;
            if (!Guid.TryParse(parts[0], out var id1) || !Guid.TryParse(parts[1], out var id2))
                return null;
            return (id1, id2);
        }
    }
}
