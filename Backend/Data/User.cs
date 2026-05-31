using System;
using System.Collections.Generic;

namespace CosplayEventBooking.Entities
{
    public enum UserRole
    {
        Admin,
        EventOrganizer,
        ServiceProvider,
        Customer
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public UserRole Role { get; set; }

        public ICollection<Booking> BookingsAsCustomer { get; set; } = new List<Booking>();
        public ICollection<BoothRegistration> BoothRegistrations { get; set; } = new List<BoothRegistration>();
        public ICollection<Ticket> PurchasedTickets { get; set; } = new List<Ticket>();
    }

}