using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Persistence;

namespace SchoolAdmission.Infrastructure.Services;

public class ClassService : IClassService
{
    private readonly ApplicationDbContext _context;

    public ClassService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ClassResponse> CreateAsync(
        CreateClassRequest request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<Shift>(
            request.Shift,
            true,
            out var shift))
        {
            throw new ArgumentException("Invalid shift.");
        }

        var exists = await _context.SchoolClasses
            .AnyAsync(
                x => x.ClassNumber == request.ClassNumber
                  && x.Shift == shift,
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "This class and shift already exist.");
        }

        var schoolClass = new SchoolClass
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            ClassNumber = request.ClassNumber,
            Shift = shift,
            TotalSeats = request.TotalSeats,
            HeldSeats = 0,
            ConfirmedSeats = 0,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SchoolClasses.Add(schoolClass);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToResponse(schoolClass);
    }

    public async Task<List<ClassResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        var classes = await _context.SchoolClasses
            .AsNoTracking()
            .OrderBy(x => x.ClassNumber)
            .ThenBy(x => x.Shift)
            .ToListAsync(cancellationToken);

        return classes.Select(MapToResponse).ToList();
    }

    public async Task<ClassResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var schoolClass = await _context.SchoolClasses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == id,
                cancellationToken);

        return schoolClass is null
            ? null
            : MapToResponse(schoolClass);
    }

    private static ClassResponse MapToResponse(
        SchoolClass schoolClass)
    {
        return new ClassResponse
        {
            Id = schoolClass.Id,
            Name = schoolClass.Name,
            ClassNumber = schoolClass.ClassNumber,
            Shift = schoolClass.Shift.ToString(),
            TotalSeats = schoolClass.TotalSeats,
            HeldSeats = schoolClass.HeldSeats,
            ConfirmedSeats = schoolClass.ConfirmedSeats,
            AvailableSeats = schoolClass.AvailableSeats
        };
    }
}