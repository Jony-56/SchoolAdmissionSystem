using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("api")]
public class AdmissionHoldsController : ControllerBase
{
    private readonly IAdmissionHoldService _holdService;

    public AdmissionHoldsController(
        IAdmissionHoldService holdService)
    {
        _holdService = holdService;
    }

    // POST /classes/{classId}/holds
    [HttpPost("classes/{classId:guid}/holds")]
    public async Task<IActionResult> CreateHold(
        Guid classId,
        [FromHeader(Name = "X-Student-Id")] string studentId,
        CancellationToken cancellationToken)
    {
        var result = await _holdService.CreateHoldAsync(
            classId,
            studentId,
            cancellationToken);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new { message = result.ErrorMessage });
        }

        return StatusCode(201, result.Data);
    }

    // GET /holds/{holdId}
    [HttpGet("holds/{holdId:guid}")]
    public async Task<IActionResult> GetHold(
        Guid holdId,
        CancellationToken cancellationToken)
    {
        var result = await _holdService.GetHoldAsync(
            holdId,
            cancellationToken);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new { message = result.ErrorMessage });
        }

        return Ok(result.Data);
    }

    // POST /holds/{holdId}/confirm
    [HttpPost("holds/{holdId:guid}/confirm")]
    public async Task<IActionResult> ConfirmHold(
        Guid holdId,
        [FromHeader(Name = "X-Student-Id")] string studentId,
        CancellationToken cancellationToken)
    {
        var result = await _holdService.ConfirmHoldAsync(
            holdId,
            studentId,
            cancellationToken);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new { message = result.ErrorMessage });
        }

        return Ok(result.Data);
    }

    // DELETE /holds/{holdId}
    [HttpDelete("holds/{holdId:guid}")]
    public async Task<IActionResult> CancelHold(
        Guid holdId,
        [FromHeader(Name = "X-Student-Id")] string studentId,
        CancellationToken cancellationToken)
    {
        var result = await _holdService.CancelHoldAsync(
            holdId,
            studentId,
            cancellationToken);

        if (!result.Success)
        {
            return StatusCode(
                result.StatusCode,
                new { message = result.ErrorMessage });
        }

        return NoContent();
    }

    // GET /me/holds
    [HttpGet("me/holds")]
    public async Task<IActionResult> GetMyHolds(
        [FromHeader(Name = "X-Student-Id")] string studentId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(studentId) ||
            !System.Text.RegularExpressions.Regex.IsMatch(
                studentId, @"^[0-9]{17}$"))
        {
            return BadRequest(new
            {
                message = "Student ID must contain exactly 17 digits."
            });
        }

        var result = await _holdService.GetMyHoldsAsync(
            studentId,
            cancellationToken);

        return Ok(result);
    }
}