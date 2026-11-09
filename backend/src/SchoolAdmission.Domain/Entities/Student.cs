namespace SchoolAdmission.Domain.Entities;

public class Student
{
    public string BirthRegistrationNumber { get; set; }
        = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AdmissionHold> AdmissionHolds { get; set; }
        = new List<AdmissionHold>();
}