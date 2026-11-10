
using System.Net;
using System.Net.Http.Json;
using Xunit;

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
}
