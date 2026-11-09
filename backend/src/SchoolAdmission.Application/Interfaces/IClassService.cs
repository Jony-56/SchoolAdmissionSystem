using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IClassService
{
    Task<ClassResponse> CreateAsync(
        CreateClassRequest request,
        CancellationToken cancellationToken);

    Task<List<ClassResponse>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<ClassResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);
}