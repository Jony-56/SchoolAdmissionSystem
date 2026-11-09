namespace SchoolAdmission.Application.DTOs;

public class HoldResult<T>
{
    public bool Success { get; set; }

    public T? Data { get; set; }

    public string? ErrorMessage { get; set; }

    public int StatusCode { get; set; }

    public static HoldResult<T> Ok(T data)
    {
        return new HoldResult<T>
        {
            Success = true,
            Data = data,
            StatusCode = 200
        };
    }

    public static HoldResult<T> Fail(
        string message,
        int statusCode)
    {
        return new HoldResult<T>
        {
            Success = false,
            ErrorMessage = message,
            StatusCode = statusCode
        };
    }
}