using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Application.DTOs;

public class CreateClassRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Range(1, 12)]
    public int ClassNumber { get; set; }

    [Required]
    [RegularExpression("^(Morning|Day)$")]
    public string Shift { get; set; } = string.Empty;

    [Range(1, 10000)]
    public int TotalSeats { get; set; }
}