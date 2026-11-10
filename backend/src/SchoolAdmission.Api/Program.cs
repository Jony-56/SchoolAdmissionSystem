using Microsoft.Extensions.Hosting;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Infrastructure;
using System.Net.Mime;
using System.Reflection.PortableExecutable;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

// Database Configuration
builder.Services.AddInfrastructure(builder.Configuration);

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();

app.UseSwaggerUI();

app.UseCors("FrontendPolicy");

app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "School Admission API is running!");

app.Run();

