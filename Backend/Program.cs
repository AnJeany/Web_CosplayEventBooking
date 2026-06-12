using CosplayEventBooking.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ===== Service Registration =====

// Đăng ký Controllers (tất cả API Controllers trong dự án)
builder.Services.AddControllers();

// Đăng ký DbContext với SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Đăng ký OpenAPI/Swagger cho môi trường Development
builder.Services.AddOpenApi();

// Cấu hình CORS cho phép Frontend gọi API (dev mode - allow all origins)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ===== Middleware Pipeline =====

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("DevPolicy");

// Map tất cả các API Controllers được đăng ký
app.MapControllers();

app.Run();
