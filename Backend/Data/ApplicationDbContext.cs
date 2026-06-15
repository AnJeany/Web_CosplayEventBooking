using CosplayEventBooking.Entities;
using Microsoft.EntityFrameworkCore;

namespace CosplayEventBooking.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<ProfilePost> ProfilePosts { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<BoothRegistration> BoothRegistrations { get; set; }
        public DbSet<ServicePost> ServicePosts { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<CommunityPost> CommunityPosts { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<CommunityLike> CommunityLikes { get; set; }

        // --- THÊM BẢNG ADMINLOG CHUẨN ---
        public DbSet<AdminLog> AdminLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình precision cho decimal để tránh SQL Server truncation
            modelBuilder.Entity<Event>()
                .Property(e => e.TicketPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ServicePost>()
                .Property(sp => sp.Price)
                .HasPrecision(18, 2);

            // --- CẤU HÌNH RÀNG BUỘC CHO ADMINLOG ---
            modelBuilder.Entity<AdminLog>()
                .HasOne(al => al.Admin)
                .WithMany()
                .HasForeignKey(al => al.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ServicePost>()
                .HasOne(sp => sp.ServiceProvider) 
                .WithMany() 
                .HasForeignKey(sp => sp.ServiceProviderId)
                .OnDelete(DeleteBehavior.Restrict); 

            // Cấu hình bảng Message (1 tin nhắn có 2 User: Người gửi và Người nhận)
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Chặn Cascade Delete cho Booking để tránh lỗi SQL Server
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Customer)
                .WithMany(u => u.BookingsAsCustomer)
                .HasForeignKey(b => b.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Chặn Cascade Delete cho BoothRegistration
            modelBuilder.Entity<BoothRegistration>()
                .HasOne(br => br.ServiceProvider)
                .WithMany(u => u.BoothRegistrations)
                .HasForeignKey(br => br.ServiceProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Chặn Cascade Delete cho Ticket
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Customer)
                .WithMany(u => u.PurchasedTickets)
                .HasForeignKey(t => t.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Chặn Cascade Delete cho Comment
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Chặn Cascade Delete cho CommunityLike
            modelBuilder.Entity<CommunityLike>()
                .HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Cấu hình self-referential cho Comment (nested comment / reply)
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}