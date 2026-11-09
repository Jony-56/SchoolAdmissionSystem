using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Domain.Entities;

public class AdmissionHold
{
    public Guid Id { get; set; }

    public Guid SchoolClassId { get; set; }

    public string StudentId { get; set; } = string.Empty;

    public HoldStatus Status { get; set; } = HoldStatus.HELD;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public SchoolClass SchoolClass { get; set; } = null!;

    public Student Student { get; set; } = null!;
}