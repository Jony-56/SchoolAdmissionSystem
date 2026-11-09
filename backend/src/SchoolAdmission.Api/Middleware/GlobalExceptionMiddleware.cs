using System.Net;
using System.Text.Json;

namespace SchoolAdmission.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException)
            when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation("Request was cancelled.");
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "An unexpected error occurred.");

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();

            context.Response.StatusCode =
                (int)HttpStatusCode.InternalServerError;

            context.Response.ContentType = "application/json";

            var response = new
            {
                status = 500,
                message = "An unexpected server error occurred. Please try again later."
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response));
        }
    }
}