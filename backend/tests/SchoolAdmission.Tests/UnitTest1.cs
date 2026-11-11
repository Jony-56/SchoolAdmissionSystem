
using System.Net;
using System.Net.Http.Json;
using System.Globalization;
using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Tests;

public class AdmissionApiTests
{
    private readonly HttpClient _client;

    public AdmissionApiTests()
    {
        _client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:8080")
        };
    }

    [Fact]
    public async Task GetClasses_ShouldReturnSuccess()
    {
        var response = await _client.GetAsync("/api/classes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateClass_WithInvalidData_ShouldReturnBadRequest()
    {
        var invalidClass = new
        {
            name = "",
            classNumber = 0,
            shift = "Morning",
            totalSeats = 0
        };

        var response = await _client.PostAsJsonAsync(
            "/api/classes",
            invalidClass
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConcurrentHoldRequests_ShouldNotExceedAvailableSeats()
    {
        // Arrange: Create a class with only 3 seats.
        var createClassResponse = await _client.PostAsJsonAsync(
            "/api/classes",
            new
            {
                name = $"Concurrency Test {Guid.NewGuid():N}",
                classNumber = 1,
                shift = "Morning",
                totalSeats = 3
            }
        );

        Assert.Equal(HttpStatusCode.Created, createClassResponse.StatusCode);

        var createdClass =
            await createClassResponse.Content.ReadFromJsonAsync<ClassResponse>();

        Assert.NotNull(createdClass);

        // Act: Send 10 simultaneous requests with unique Student IDs.
        var firstStudentId =
            10_000_000_000_000_000L +
            (DateTime.UtcNow.Ticks % 80_000_000_000_000_000L);

        var tasks = Enumerable.Range(0, 10).Select(async index =>
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"/api/classes/{createdClass.Id}/holds"
            );

            request.Headers.Add(
                "X-Student-Id",
                (firstStudentId + index).ToString(CultureInfo.InvariantCulture)
            );

            return await _client.SendAsync(request);
        });

        var responses = await Task.WhenAll(tasks);

        // Assert: Only 3 requests should succeed.
        Assert.Equal(
            3,
            responses.Count(r => r.StatusCode == HttpStatusCode.Created)
        );

        Assert.Equal(
            7,
            responses.Count(r => r.StatusCode == HttpStatusCode.Conflict)
        );

        // Verify that the seat limit was not exceeded.
        var classResponse = await _client.GetAsync(
            $"/api/classes/{createdClass.Id}"
        );

        Assert.Equal(HttpStatusCode.OK, classResponse.StatusCode);

        var updatedClass =
            await classResponse.Content.ReadFromJsonAsync<ClassResponse>();

        Assert.NotNull(updatedClass);
        Assert.Equal(3, updatedClass.HeldSeats);
        Assert.Equal(0, updatedClass.AvailableSeats);

        foreach (var response in responses)
        {
            response.Dispose();
        }
    }
}
