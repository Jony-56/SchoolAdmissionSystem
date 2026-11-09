using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Persistence;

namespace SchoolAdmission.Infrastructure.Services;

public class ExpiredHoldCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpiredHoldCleanupService> _logger;

    public ExpiredHoldCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<ExpiredHoldCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Expired Hold Cleanup Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredHoldsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error while cleaning expired holds.");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task CleanupExpiredHoldsAsync(
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

        var now = DateTime.UtcNow;

        // Find classes having expired active holds.
        var classIds = await context.AdmissionHolds
            .AsNoTracking()
            .Where(x =>
                x.Status == HoldStatus.HELD &&
                x.ExpiresAtUtc <= now)
            .Select(x => x.SchoolClassId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var classId in classIds)
        {
            await ReleaseExpiredHoldsForClassAsync(
                context,
                classId,
                cancellationToken);
        }
    }

    private async Task ReleaseExpiredHoldsForClassAsync(
        ApplicationDbContext context,
        Guid classId,
        CancellationToken cancellationToken)
    {
        await using var transaction =
            await context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            // Lock the class row to coordinate with booking APIs.
            var schoolClass = await context.SchoolClasses
                .FromSqlInterpolated(
                    $"""
                    SELECT * FROM "SchoolClasses"
                    WHERE "Id" = {classId}
                    FOR UPDATE
                    """)
                .FirstOrDefaultAsync(cancellationToken);

            if (schoolClass is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            var now = DateTime.UtcNow;

            var expiredHolds = await context.AdmissionHolds
                .Where(x =>
                    x.SchoolClassId == classId &&
                    x.Status == HoldStatus.HELD &&
                    x.ExpiresAtUtc <= now)
                .ToListAsync(cancellationToken);

            if (expiredHolds.Count == 0)
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            foreach (var hold in expiredHolds)
            {
                hold.Status = HoldStatus.EXPIRED;
            }

            schoolClass.HeldSeats -= expiredHolds.Count;

            await context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "{Count} expired holds released for class {ClassId}.",
                expiredHolds.Count,
                classId);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}