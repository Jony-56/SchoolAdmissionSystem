using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Persistence;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace SchoolAdmission.Infrastructure.Services;

public class AdmissionHoldService : IAdmissionHoldService
{
    private readonly ApplicationDbContext _context;
    private readonly int _holdDurationSeconds;

    public AdmissionHoldService(
        ApplicationDbContext context,
        IConfiguration configuration)
    {
        _context = context;

        _holdDurationSeconds = int.TryParse(
            configuration["HOLD_DURATION_SECONDS"],
            out var seconds) && seconds > 0
                ? seconds
                : 600;
    }

    // =========================================
    // 1. CREATE HOLD
    // =========================================

    public async Task<HoldResult<HoldResponse>> CreateHoldAsync(
        Guid classId,
        string studentId,
        CancellationToken cancellationToken)
    {
        if (!IsValidStudentId(studentId))
        {
            return HoldResult<HoldResponse>.Fail(
                "Student ID must contain exactly 17 digits.",
                400);
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            // Lock the class row.
            var schoolClass = await LockClassAsync(
                classId,
                cancellationToken);

            if (schoolClass is null)
            {
                return HoldResult<HoldResponse>.Fail(
                    "Class not found.",
                    404);
            }

            var now = DateTime.UtcNow;

            // Release expired holds for this class.
            var expiredCount = await ExpireClassHoldsAsync(
    schoolClass.Id,
    now,
    cancellationToken);

            if (expiredCount > 0)
            {
                schoolClass.HeldSeats -= expiredCount;

                await _context.SaveChangesAsync(cancellationToken);
            }

            // Check existing active application.
            var existingHold = await _context.AdmissionHolds
                .FirstOrDefaultAsync(
                    x => x.StudentId == studentId
                      && x.SchoolClassId == classId
                      && (x.Status == HoldStatus.HELD ||
                          x.Status == HoldStatus.CONFIRMED),
                    cancellationToken);

            if (existingHold is not null)
            {
                await transaction.CommitAsync(cancellationToken);

                return HoldResult<HoldResponse>.Fail(
                    "You already have an active application for this class.",
                    409);
            }

            // Check available seats.
            if (schoolClass.AvailableSeats <= 0)
            {
                await transaction.CommitAsync(cancellationToken);

                return HoldResult<HoldResponse>.Fail(
                    "No seats available for this class.",
                    409);
            }

            // Insert student if it does not exist.
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"""
                INSERT INTO "Students"
                    ("BirthRegistrationNumber", "CreatedAtUtc")
                VALUES
                    ({studentId}, {now})
                ON CONFLICT ("BirthRegistrationNumber")
                DO NOTHING
                """,
                cancellationToken);

            var hold = new AdmissionHold
            {
                Id = Guid.NewGuid(),
                SchoolClassId = classId,
                StudentId = studentId,
                Status = HoldStatus.HELD,
                CreatedAtUtc = now,
                ExpiresAtUtc = now.AddSeconds(
                    _holdDurationSeconds)
            };

            _context.AdmissionHolds.Add(hold);

            schoolClass.HeldSeats++;

            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return HoldResult<HoldResponse>.Ok(
                MapToResponse(hold, schoolClass));
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);

            return HoldResult<HoldResponse>.Fail(
                "An active application already exists or the request conflicts with database constraints.",
                409);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // =========================================
    // 2. GET HOLD STATUS
    // =========================================

    public async Task<HoldResult<HoldResponse>> GetHoldAsync(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        var hold = await _context.AdmissionHolds
            .AsNoTracking()
            .Include(x => x.SchoolClass)
            .FirstOrDefaultAsync(
                x => x.Id == holdId,
                cancellationToken);

        if (hold is null)
        {
            return HoldResult<HoldResponse>.Fail(
                "Application not found.",
                404);
        }

        if (hold.Status == HoldStatus.HELD &&
            hold.ExpiresAtUtc <= DateTime.UtcNow)
        {
            await ExpireSingleHoldAsync(
                holdId,
                cancellationToken);

            hold = await _context.AdmissionHolds
                .AsNoTracking()
                .Include(x => x.SchoolClass)
                .FirstAsync(
                    x => x.Id == holdId,
                    cancellationToken);
        }

        return HoldResult<HoldResponse>.Ok(
            MapToResponse(hold, hold.SchoolClass));
    }

    // =========================================
    // 3. CONFIRM HOLD
    // =========================================

    public async Task<HoldResult<HoldResponse>> ConfirmHoldAsync(
        Guid holdId,
        string studentId,
        CancellationToken cancellationToken)
    {
        if (!IsValidStudentId(studentId))
        {
            return HoldResult<HoldResponse>.Fail(
                "Invalid Student ID.",
                400);
        }

        var existing = await _context.AdmissionHolds
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == holdId,
                cancellationToken);

        if (existing is null)
        {
            return HoldResult<HoldResponse>.Fail(
                "Application not found.",
                404);
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            var schoolClass = await LockClassAsync(
                existing.SchoolClassId,
                cancellationToken);

            if (schoolClass is null)
            {
                return HoldResult<HoldResponse>.Fail(
                    "Class not found.",
                    404);
            }

            var hold = await _context.AdmissionHolds
                .FirstOrDefaultAsync(
                    x => x.Id == holdId,
                    cancellationToken);

            if (hold is null)
            {
                return HoldResult<HoldResponse>.Fail(
                    "Application not found.",
                    404);
            }

            if (hold.StudentId != studentId)
            {
                return HoldResult<HoldResponse>.Fail(
                    "You are not authorized to confirm this application.",
                    403);
            }

            // Idempotency: repeated confirmation must not
            // increase ConfirmedSeats again.
            if (hold.Status == HoldStatus.CONFIRMED)
            {
                await transaction.CommitAsync(cancellationToken);

                return HoldResult<HoldResponse>.Ok(
                    MapToResponse(hold, schoolClass));
            }

            if (hold.Status == HoldStatus.EXPIRED)
            {
                return HoldResult<HoldResponse>.Fail(
                    "This application has expired.",
                    409);
            }

            if (hold.Status == HoldStatus.CANCELLED)
            {
                return HoldResult<HoldResponse>.Fail(
                    "This application has been cancelled.",
                    409);
            }

            var now = DateTime.UtcNow;

            if (hold.ExpiresAtUtc <= now)
            {
                hold.Status = HoldStatus.EXPIRED;

                schoolClass.HeldSeats--;

                await _context.SaveChangesAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                return HoldResult<HoldResponse>.Fail(
                    "This application has expired.",
                    409);
            }

            hold.Status = HoldStatus.CONFIRMED;
            hold.ConfirmedAtUtc = now;

            schoolClass.HeldSeats--;
            schoolClass.ConfirmedSeats++;

            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return HoldResult<HoldResponse>.Ok(
                MapToResponse(hold, schoolClass));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // =========================================
    // 4. CANCEL HOLD
    // =========================================

    public async Task<HoldResult<bool>> CancelHoldAsync(
        Guid holdId,
        string studentId,
        CancellationToken cancellationToken)
    {
        if (!IsValidStudentId(studentId))
        {
            return HoldResult<bool>.Fail(
                "Invalid Student ID.",
                400);
        }

        var existing = await _context.AdmissionHolds
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == holdId,
                cancellationToken);

        if (existing is null)
        {
            return HoldResult<bool>.Fail(
                "Application not found.",
                404);
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            var schoolClass = await LockClassAsync(
                existing.SchoolClassId,
                cancellationToken);

            var hold = await _context.AdmissionHolds
                .FirstOrDefaultAsync(
                    x => x.Id == holdId,
                    cancellationToken);

            if (schoolClass is null || hold is null)
            {
                return HoldResult<bool>.Fail(
                    "Application not found.",
                    404);
            }

            if (hold.StudentId != studentId)
            {
                return HoldResult<bool>.Fail(
                    "You are not authorized to cancel this application.",
                    403);
            }

            if (hold.Status != HoldStatus.HELD)
            {
                return HoldResult<bool>.Fail(
                    "Only active held applications can be cancelled.",
                    409);
            }

            hold.Status = hold.ExpiresAtUtc <= DateTime.UtcNow
                ? HoldStatus.EXPIRED
                : HoldStatus.CANCELLED;

            schoolClass.HeldSeats--;

            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return HoldResult<bool>.Ok(true);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    // =========================================
    // 5. GET MY APPLICATIONS
    // =========================================

    public async Task<List<HoldResponse>> GetMyHoldsAsync(
        string studentId,
        CancellationToken cancellationToken)
    {
        var holds = await _context.AdmissionHolds
            .AsNoTracking()
            .Include(x => x.SchoolClass)
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        foreach (var hold in holds.Where(
            x => x.Status == HoldStatus.HELD &&
                 x.ExpiresAtUtc <= DateTime.UtcNow))
        {
            await ExpireSingleHoldAsync(
                hold.Id,
                cancellationToken);
        }

        holds = await _context.AdmissionHolds
            .AsNoTracking()
            .Include(x => x.SchoolClass)
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return holds.Select(
            x => MapToResponse(x, x.SchoolClass)).ToList();
    }

    // =========================================
    // HELPER METHODS
    // =========================================

    private async Task<SchoolClass?> LockClassAsync(
        Guid classId,
        CancellationToken cancellationToken)
    {
        return await _context.SchoolClasses
            .FromSqlInterpolated(
                $"""
                SELECT * FROM "SchoolClasses"
                WHERE "Id" = {classId}
                FOR UPDATE
                """)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<int> ExpireClassHoldsAsync(
        Guid classId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var expiredHolds = await _context.AdmissionHolds
            .Where(x =>
                x.SchoolClassId == classId &&
                x.Status == HoldStatus.HELD &&
                x.ExpiresAtUtc <= now)
            .ToListAsync(cancellationToken);

        foreach (var hold in expiredHolds)
        {
            hold.Status = HoldStatus.EXPIRED;
        }

        return expiredHolds.Count;
    }

    private async Task ExpireSingleHoldAsync(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        var classId = await _context.AdmissionHolds
            .Where(x => x.Id == holdId)
            .Select(x => x.SchoolClassId)
            .FirstOrDefaultAsync(cancellationToken);

        if (classId == Guid.Empty)
            return;

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        var schoolClass = await LockClassAsync(
            classId,
            cancellationToken);

        var hold = await _context.AdmissionHolds
            .FirstOrDefaultAsync(
                x => x.Id == holdId,
                cancellationToken);

        if (schoolClass is not null &&
            hold is not null &&
            hold.Status == HoldStatus.HELD &&
            hold.ExpiresAtUtc <= DateTime.UtcNow)
        {
            hold.Status = HoldStatus.EXPIRED;
            schoolClass.HeldSeats--;

            await _context.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    private static bool IsValidStudentId(string studentId)
    {
        return !string.IsNullOrWhiteSpace(studentId) &&
               Regex.IsMatch(studentId, @"^[0-9]{17}$");
    }

    private static HoldResponse MapToResponse(
        AdmissionHold hold,
        SchoolClass schoolClass)
    {
        return new HoldResponse
        {
            HoldId = hold.Id,
            ClassId = hold.SchoolClassId,
            ClassName = schoolClass.Name,
            StudentId = hold.StudentId,
            Status = hold.Status.ToString(),
            ExpiresAt = hold.ExpiresAtUtc,
            ConfirmedAt = hold.ConfirmedAtUtc
        };
    }
}