using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CosplayEventBooking.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEventAndBoothDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BannerUrl",
                table: "Events",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Stages",
                table: "Events",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Contact",
                table: "BoothRegistrations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "BoothRegistrations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PortfolioLink",
                table: "BoothRegistrations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "BoothRegistrations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "BoothRegistrations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerUrl",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Stages",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Contact",
                table: "BoothRegistrations");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "BoothRegistrations");

            migrationBuilder.DropColumn(
                name: "PortfolioLink",
                table: "BoothRegistrations");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "BoothRegistrations");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "BoothRegistrations");
        }
    }
}
