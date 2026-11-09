using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IAdmissionHoldService
{
    Task<HoldResult<HoldResponse>> CreateHoldAsync(
        Guid classId,
        string studentId,
        CancellationToken cancellationToken);

    Task<HoldResult<HoldResponse>> GetHoldAsync(
        Guid holdId,
        CancellationToken cancellationToken);

    Task<HoldResult<HoldResponse>> ConfirmHoldAsync(
        Guid holdId,
        string studentId,
        CancellationToken cancellationToken);

    Task<HoldResult<bool>> CancelHoldAsync(
        Guid holdId,
        string studentId,
        CancellationToken cancellationToken);

    Task<List<HoldResponse>> GetMyHoldsAsync(
        string studentId,
        CancellationToken cancellationToken);
}