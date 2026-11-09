using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateClassRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _classService.CreateAsync(
                request,
                cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { classId = result.Id },
                result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var result = await _classService.GetAllAsync(
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{classId:guid}")]
    public async Task<IActionResult> GetById(
        Guid classId,
        CancellationToken cancellationToken)
    {
        var result = await _classService.GetByIdAsync(
            classId,
            cancellationToken);

        if (result is null)
        {
            return NotFound(new
            {
                message = "Class not found."
            });
        }

        return Ok(result);
    }
}