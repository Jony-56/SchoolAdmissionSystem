using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Domain.Entities;

public class SchoolClass
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int ClassNumber { get; set; }

    public Shift Shift { get; set; }

    public int TotalSeats { get; set; }

    public int HeldSeats { get; set; }

    public int ConfirmedSeats { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public int AvailableSeats =>
        TotalSeats - HeldSeats - ConfirmedSeats;

    public ICollection<AdmissionHold> AdmissionHolds { get; set; }
        = new List<AdmissionHold>();
}